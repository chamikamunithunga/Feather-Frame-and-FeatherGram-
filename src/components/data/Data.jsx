import { FaUser, FaUsers, FaHandshake, FaCalendarCheck } from 'react-icons/fa';

export const nav = [
  {
    text: "home",
    path: "/",
  },
  {
    text: "about",
    path: "/about",
  },
  {
    text: "services",
    path: "/services",
  },
  {
    text: "blog",
    path: "/blog",
  },
  {
    text: "pricing",
    path: "/pricing",
  },
  {
    text: "contact",
    path: "/contact",
  },
]
export const featured = [
  {
    cover: "../images/hero/h1.png",
    name: "Family House",
    total: "122 Property",
  },
  {
    cover: "../images/hero/h2.png",
    name: "House & Villa",
    total: "155 Property",
  },
  {
    cover: "../images/hero/h3.png",
    name: "Apartment",
    total: "300 Property",
  },
  {
    cover: "../images/hero/h4.png",
    name: "Office & Studio",
    total: "80 Property",
  },
  {
    cover: "../images/hero/h6.png",
    name: "Villa & Condo",
    total: "80 Property",
  },
]
export const list = [
  {
    id: 1,
    cover: "../images/list/p-1.png",
    name: "Red Carpet Real Estate",
    location: "210 Zirak Road, Canada",
    category: "For Rent",
    price: "$3,700",
    type: "Apartment",
  },
  {
    id: 2,
    cover: "../images/list/p-2.png",
    name: "Fairmount Properties",
    location: "5698 Zirak Road, NewYork",
    category: "For Sale",
    price: "$9,750",
    type: "Condos",
  },
  {
    id: 3,
    cover: "../images/list/p-7.png",
    name: "The Real Estate Corner",
    location: "5624 Mooker Market, USA",
    category: "For Rent",
    price: "$5,860",
    type: "Migratory",
  },
  {
    id: 4,
    cover: "../images/list/p-4.png",
    name: "Herringbone Realty",
    location: "5621 Liverpool, London",
    category: "For Sale",
    price: "$7,540",
    type: "Homes & Villas",
  },
  {
    id: 5,
    cover: "../images/list/p-5.png",
    name: "Brick Lane Realty",
    location: "210 Montreal Road, Canada",
    category: "For Rent",
    price: "$4,850",
    type: "Commercial",
  },
  {
    id: 6,
    cover: "../images/list/p-6.png",
    name: "Banyon Tree Realty",
    location: "210 Zirak Road, Canada",
    category: "For Sale",
    price: "$2,742",
    type: "Apartment",
  },
  ]
export const awards = [
  {
    icon: <FaUser />,
    num: "32 	",
    name: "Profiles",
  },
  {
    icon: <FaUsers />,
    num: "7",
    name: "Community Groups",
  },
  {
    icon: <FaHandshake />,
    num: "3",
    name: "Community Meetups",
  },
  {
    icon: <FaCalendarCheck />,
    num: "12",
    name: "Events",
  },
]
export const location = [
  {
    id: 1,
    name: "Sinharaja Rainforest",
    totbird: "147 Species",
    rarebird: "21 Endemic",
    Migratory: "13% Migratory",
    cover: "./images/location/Sinharaja.jpg",
  },
  {
    id: 2,
    name: "Horton Plains National Park",
    totbird: "Not specified",
    rarebird: "21 Endemic",
    Migratory: "Present Migratory",
    cover: "./images/location/hplains.jpg",
  },
  {
    id: 3,
    name: "Knuckles Mountain Range",
    totbird: "Not specified",
    rarebird: " Present Endemic",
    Migratory: "Present Migratory",
    cover: "./images/location/knukles.jpeg",
  },
  {
    id: 4,
    name: "Kumana National Park",
    totbird: "255 Species",
    rarebird: " Not specified Endemic",
    Migratory: "10 Migratory",
    cover: "./images/location/kumana.jpg",
  },
  {
    id: 5,
    name: "Yala National Park (Block I & II)",
    totbird: "215 Species",
    rarebird: " 7 Endemic",
    Migratory: "45  Migratory",
    cover: "./images/location/yala.jpg",
  },
  {
    id: 6,
    name: "Udawalawe National Park",
    totbird: "255 Species",
    rarebird: " Several Endemic",
    Migratory: "33  Migratory",
    cover: "./images/location/udawalawa.jpg",
  },
]
export const team = [
  {
    cover: "./images/customer/logo.jpeg",
    name: "Mr. Pradeep",
    whatsapp: "+94771234567",
    location: "Yala National Park",
  },
  {
    cover: "./images/customer/logo.jpeg",
    name: "Mr. Milton",
    whatsapp: "+94772234567",
    location: "Dunumadalawa Forest, Kandy",
  },
  {
    cover: "./images/customer/logo.jpeg",
    name: "Ms. Sumudu",
    whatsapp: "+94773234567",
    location: "Kumana National Park",
  },
  {
    cover: "./images/customer/logo.jpeg",
    name: "Mr. Kasun",
    whatsapp: "+94774234567",
    location: "Udawalawe National Park",
  },
  {
    cover: "./images/customer/logo.jpeg",
    name: "Ms. Dilani",
    whatsapp: "+94775234567",
    location: "Horton Plains National Park",
  },
  {
    cover: "./images/customer/logo.jpeg",
    name: "Mr. Roshan",
    whatsapp: "+94776234567",
    location: "Knuckles Mountain Range",
  },
]
export const price = [
  {
    plan: "FeatherSprout (Beginners Community)",
   
    list: [
      {
        icon: <i className='fa-solid fa-check'></i>,
        text: "First-time birders",
      },
      {
        icon: <i className='fa-solid fa-check'></i>,
        text: "Beginners in wildlife photography",
      },
      {
        icon: <i className='fa-solid fa-check'></i>,
        text: "Curious learners and school groups",
      },
      {
        icon: <i className='fa-solid fa-check'></i>,
        text: "Rare species documentation",
      },
      
      
    ],
  },
  {
    best: "WingQuest (Intermediate Community)",
    plan: "Standard",
    
    list: [
      {
        icon: <i className='fa-solid fa-check'></i>,
        text: "Hobbyists with some field experience",
      },
      {
        icon: <i className='fa-solid fa-check'></i>,
        text: "Amateur wildlife photographers",
      },
      {
        icon: <i className='fa-solid fa-check'></i>,
        text: "People exploring multiple forests or tracking migration",
      },
      {
        icon: <i className='fa-solid fa-check'></i>,
        text: "Rare species documentation",
      },

    ],
  },
  {
    plan: "AeroElite (Pro Community)",
    
    list: [
      {
        icon: <i className='fa-solid fa-check'></i>,
        text: "Professionals in bird/wildlife photography",
      },
      {
        icon: <i className='fa-solid fa-check'></i>,
        text: "Researchers, conservationists, and forest agents",
      },
      {
        icon: <i className='fa-solid fa-check'></i>,
        text: "Competitive or award-winning photographers",
      },
      {
        icon: <i className='fa-solid fa-check'></i>,
        text: "Forest swap groups: join birders from different provinces",
      },
      {
        icon: <i className='fa-solid fa-check'></i>,
        text: "Rare species documentation",
      },
    ],
  },
]
export const footer = [
  {
    title: "LAYOUTS",
    text: [
      { list: "Home Page", path: "/" }, 
      { list: "About Page", path: "/about" }, 
      { list: "Service Page", path: "/services" }, 
      { list: "Contact Page", path: "/contact" }, 
      { list: "Blog", path: "/blog" }
    ],
  },
  {
    title: "ALL SECTIONS",
    text: [
      { list: "Headers", path: "/" }, 
      { list: "Features", path: "/#ai-section" }, 
      { list: "Attractive", path: "/" }, 
      { list: "Testimonials", path: "/about" }, 
      { list: "Videos", path: "/blog" }, 
      { list: "Footers", path: "/contact" }
    ],
  },
  {
    title: "COMPANY",
    text: [
      { list: "About", path: "/about" }, 
      { list: "Blog", path: "/blog" }, 
      { list: "Pricing", path: "/pricing" }, 
      { list: "Affiliate", path: "/about" }, 
      { list: "Login", path: "/login" }, 
      { list: "Changelog", path: "/blog" }
    ],
  },
] 