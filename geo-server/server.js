import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { GoogleGenerativeAI } from '@google/generative-ai'

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
// Use a lighter default model to reduce quota pressure; allow override via env
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-1.5-flash'
const model = genAI.getGenerativeModel({ model: MODEL_NAME })

const FOREST_REGEX_HINT = '(national park|forest|reserve|sanctuary|woods|rainforest|jungle|wildlife|nature|biosphere|conservancy|protected area|game reserve|state park|park)'

// Simple coordinate-based geographical inference for eBird-style data
function inferGeoFromCoordinates(lat, lng) {
  const latitude = parseFloat(lat)
  const longitude = parseFloat(lng)
  
  if (isNaN(latitude) || isNaN(longitude)) return { country: null, region: null }

  // North America
  if (latitude >= 25 && latitude <= 72 && longitude >= -170 && longitude <= -50) {
    if (latitude >= 49 && longitude >= -141 && longitude <= -52) {
      return { country: 'Canada', region: 'Canada' }
    } else if (latitude >= 25 && latitude <= 49 && longitude >= -125 && longitude <= -66) {
      return { country: 'United States', region: 'United States' }
    } else if (latitude >= 15 && latitude <= 33 && longitude >= -118 && longitude <= -86) {
      return { country: 'Mexico', region: 'Mexico' }
    }
  }
  
  // Europe (rough boundaries)
  if (latitude >= 35 && latitude <= 72 && longitude >= -10 && longitude <= 40) {
    return { country: 'Europe', region: 'Europe' }
  }
  
  // Africa
  if (latitude >= -35 && latitude <= 37 && longitude >= -20 && longitude <= 52) {
    return { country: 'Africa', region: 'Africa' }
  }
  
  // Asia
  if (latitude >= 5 && latitude <= 75 && longitude >= 40 && longitude <= 180) {
    return { country: 'Asia', region: 'Asia' }
  }
  
  // Australia/Oceania
  if (latitude >= -50 && latitude <= -10 && longitude >= 110 && longitude <= 180) {
    return { country: 'Australia/Oceania', region: 'Australia/Oceania' }
  }
  
  // South America
  if (latitude >= -55 && latitude <= 15 && longitude >= -85 && longitude <= -30) {
    return { country: 'South America', region: 'South America' }
  }
  
  return { country: 'Unknown', region: 'Unknown' }
}

// Deterministic fallback aggregation without AI
function aggregateGeo(occurrences = []) {
  const toStringSafe = (v) => (typeof v === 'string' ? v : (v == null ? '' : String(v)))
  const countriesMap = new Map()
  const regionsMap = new Map()
  const forestsMap = new Map()
  const forestRegex = new RegExp(FOREST_REGEX_HINT, 'i')

  for (const occ of Array.isArray(occurrences) ? occurrences : []) {
    // Try traditional fields first
    let country = toStringSafe(occ.country || occ.countryCode || occ.cc || occ.country_name).trim()
    let regionCandidate = toStringSafe(
      occ.subnational2Name ||
      occ.subnational1Name ||
      occ.stateProvince ||
      occ.admin2 ||
      occ.admin1 ||
      occ.county ||
      occ.city ||
      occ.region ||
      ''
    ).trim()

    // If no traditional geographic fields, try to infer from coordinates (eBird style)
    if (!country && occ.lat && occ.lng) {
      const inferred = inferGeoFromCoordinates(occ.lat, occ.lng)
      if (inferred.country && inferred.country !== 'Unknown') {
        country = inferred.country
      }
      if (!regionCandidate && inferred.region && inferred.region !== 'Unknown') {
        regionCandidate = inferred.region
      }
    }

    // Use locName as region fallback if we still don't have region info
    if (!regionCandidate) {
      regionCandidate = toStringSafe(occ.locName || '').trim()
    }

    if (country) countriesMap.set(country, (countriesMap.get(country) || 0) + 1)
    if (regionCandidate) regionsMap.set(regionCandidate, (regionsMap.get(regionCandidate) || 0) + 1)

    const locName = toStringSafe(occ.locName || occ.location || '').trim()
    if (locName && forestRegex.test(locName)) {
      forestsMap.set(locName, (forestsMap.get(locName) || 0) + 1)
    }
  }

  const toArray = (map) => Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  return {
    countries: toArray(countriesMap),
    regions: toArray(regionsMap),
    forests: toArray(forestsMap)
  }
}

app.post('/api/geo-breakdown', async (req, res) => {
  try {
    const { speciesName, occurrences = [] } = req.body || {}

    // Fallback immediately if no API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return res.json(aggregateGeo(occurrences))
    }

    const prompt = `You are given a bird species and optional raw occurrence rows.
Return ONLY compact JSON with these exact keys: countries, regions, forests.
- countries: array of { "name": string, "count": number } aggregated by country/countryCode
- regions: array of { "name": string, "count": number } aggregated by subnational names (state/province/district/city)
- forests: array of { "name": string, "count": number } where location name matches ${FOREST_REGEX_HINT} (case-insensitive)
Rules:
- If uncertain or not enough data, return an empty array for that key.
- DO NOT include any extra keys or commentary.
Input:
species: ${speciesName || 'unknown'}
occurrences: ${JSON.stringify(occurrences).slice(0, 12000)}
Output JSON:`

    try {
      const result = await model.generateContent(prompt)
      const text = result.response.text().trim()
      const start = text.indexOf('{')
      const end = text.lastIndexOf('}')
      let out = { countries: [], regions: [], forests: [] }
      if (start !== -1 && end !== -1) {
        const parsed = JSON.parse(text.slice(start, end + 1))
        out = {
          countries: Array.isArray(parsed.countries) ? parsed.countries : [],
          regions: Array.isArray(parsed.regions) ? parsed.regions : [],
          forests: Array.isArray(parsed.forests) ? parsed.forests : []
        }
      }
      return res.json(out)
    } catch (e) {
      // On rate limit or any AI error, gracefully fallback
      console.error(e)
      return res.json(aggregateGeo(occurrences))
    }
  } catch (e) {
    console.error(e)
    // Hard failure fallback
    return res.status(500).json({ countries: [], regions: [], forests: [] })
  }
})

// Breeding & Migration details via Gemini (with hints)
app.post('/api/breeding-migration', async (req, res) => {
  try {
    const { speciesName, occurrences = [], description = '', hints = {} } = req.body || {}

    if (!process.env.GEMINI_API_KEY) {
      return res.json({ breeding: null, migration: null, fallback: true })
    }

    const prompt = `Given a bird species and optional context, output ONLY this JSON:
{
  "breeding": {
    "season": string|null,
    "system": string|null,
    "clutch_size": string|null,
    "incubation_period": string|null,
    "nesting": string|null,
    "notes": string|null
  },
  "migration": {
    "status": string|null,
    "routes": string|null,
    "timing": string|null,
    "distance": string|null,
    "ranges": string|null,
    "stopover_sites": string|null
  }
}
Rules:
- Prefer values from the provided hints if present; otherwise infer from occurrences/description/name.
- If unknown, set the field to null.
- DO NOT add any extra keys or commentary.
Input:
species: ${speciesName || 'unknown'}
description: ${description}
hints: ${JSON.stringify(hints)}
occurrences: ${JSON.stringify(occurrences).slice(0, 8000)}
Output JSON:`

    try {
      const result = await model.generateContent(prompt)
      const text = result.response.text().trim()
      const start = text.indexOf('{')
      const end = text.lastIndexOf('}')
      let out = { breeding: null, migration: null }
      if (start !== -1 && end !== -1) {
        const parsed = JSON.parse(text.slice(start, end + 1))
        out = {
          breeding: parsed.breeding || null,
          migration: parsed.migration || null
        }
      }
      return res.json(out)
    } catch (e) {
      console.error(e)
      return res.status(200).json({ breeding: null, migration: null, fallback: true })
    }
  } catch (e) {
    console.error(e)
    res.status(500).json({ breeding: null, migration: null })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Geo breakdown API listening on port ${PORT} (model: ${MODEL_NAME})`)) 