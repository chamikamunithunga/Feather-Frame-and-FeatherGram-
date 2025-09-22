export async function fetchGeoBreakdown({ speciesName, occurrences }) {
  const resp = await fetch('http://localhost:3001/api/geo-breakdown', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ speciesName, occurrences })
  })
  if (!resp.ok) throw new Error('Failed to fetch geo breakdown')
  return resp.json()
} 