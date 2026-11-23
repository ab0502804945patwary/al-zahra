import { countryCode } from '@/lib/countries'

// Province / state / division lists per country (used by the company form dropdown).
// Countries without a list fall back to a free-text field.
export const REGIONS: Record<string, string[]> = {
  'Saudi Arabia': ['Riyadh', 'Makkah', 'Madinah', 'Eastern Province', 'Qassim', 'Asir', 'Tabuk', 'Hail', 'Northern Borders', 'Jazan', 'Najran', 'Al Bahah', 'Al Jawf'],
  Bangladesh: ['Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Barishal', 'Sylhet', 'Rangpur', 'Mymensingh'],
  India: ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'],
  Pakistan: ['Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan', 'Islamabad Capital Territory', 'Gilgit-Baltistan', 'Azad Jammu and Kashmir'],
  Afghanistan: ['Kabul', 'Kandahar', 'Herat', 'Balkh', 'Nangarhar', 'Kunduz', 'Ghazni', 'Helmand', 'Badakhshan', 'Baghlan', 'Parwan', 'Takhar', 'Paktia', 'Khost', 'Laghman', 'Logar', 'Wardak', 'Faryab', 'Jowzjan', 'Samangan'],
  Sudan: ['Khartoum', 'Al Jazirah', 'Northern', 'River Nile', 'Red Sea', 'Kassala', 'Al Qadarif', 'Sennar', 'White Nile', 'Blue Nile', 'North Kordofan', 'South Kordofan', 'West Kordofan', 'North Darfur', 'South Darfur', 'West Darfur', 'Central Darfur', 'East Darfur'],
  Egypt: ['Cairo', 'Giza', 'Alexandria', 'Qalyubia', 'Port Said', 'Suez', 'Dakahlia', 'Sharqia', 'Gharbia', 'Monufia', 'Beheira', 'Kafr El Sheikh', 'Damietta', 'Ismailia', 'Fayoum', 'Beni Suef', 'Minya', 'Asyut', 'Sohag', 'Qena', 'Luxor', 'Aswan', 'Red Sea', 'New Valley', 'Matrouh', 'North Sinai', 'South Sinai'],
  'United Arab Emirates': ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'],
  Qatar: ['Doha', 'Al Rayyan', 'Al Wakrah', 'Al Khor', 'Umm Salal', 'Al Daayen', 'Al Shamal', 'Al Shahaniya'],
  Kuwait: ['Al Asimah', 'Hawalli', 'Farwaniya', 'Mubarak Al-Kabeer', 'Ahmadi', 'Jahra'],
  Bahrain: ['Capital', 'Muharraq', 'Northern', 'Southern'],
  Oman: ['Muscat', 'Dhofar', 'Musandam', 'Al Buraimi', 'Ad Dakhiliyah', 'Al Batinah North', 'Al Batinah South', 'Ash Sharqiyah North', 'Ash Sharqiyah South', 'Ad Dhahirah', 'Al Wusta'],
  Jordan: ['Amman', 'Irbid', 'Zarqa', 'Balqa', 'Madaba', 'Karak', 'Tafilah', "Ma'an", 'Aqaba', 'Jerash', 'Ajloun', 'Mafraq'],
  Turkey: ['Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep', 'Kayseri', 'Mersin', 'Eskisehir', 'Diyarbakir', 'Samsun', 'Trabzon'],
  Iraq: ['Baghdad', 'Basra', 'Nineveh', 'Erbil', 'Sulaymaniyah', 'Duhok', 'Kirkuk', 'Anbar', 'Babil', 'Karbala', 'Najaf', 'Diyala', 'Salah ad-Din', 'Wasit', 'Dhi Qar', 'Maysan', 'Muthanna', 'Qadisiyyah'],
  Yemen: ["Sana'a", 'Aden', 'Taiz', 'Hadramaut', 'Hodeidah', 'Ibb', 'Dhamar', 'Marib', 'Shabwah', 'Lahij', 'Abyan'],
  Syria: ['Damascus', 'Aleppo', 'Homs', 'Hama', 'Latakia', 'Tartus', 'Idlib', 'Raqqa', 'Deir ez-Zor', 'Hasakah', 'Daraa', 'As-Suwayda', 'Quneitra', 'Rural Damascus'],
  Lebanon: ['Beirut', 'Mount Lebanon', 'North', 'South', 'Beqaa', 'Nabatieh', 'Akkar', 'Baalbek-Hermel'],
  'United States': ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'District of Columbia', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'],
  Canada: ['Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador', 'Nova Scotia', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan', 'Northwest Territories', 'Nunavut', 'Yukon'],
  'United Kingdom': ['England', 'Scotland', 'Wales', 'Northern Ireland'],
  Mexico: ['Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua', 'Coahuila', 'Colima', 'Durango', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Mexico City', 'México', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'],
  China: ['Beijing', 'Shanghai', 'Guangdong', 'Zhejiang', 'Jiangsu', 'Shandong', 'Sichuan', 'Hubei', 'Hunan', 'Fujian', 'Henan', 'Hebei', 'Liaoning', 'Chongqing', 'Tianjin', 'Shaanxi', 'Yunnan', 'Hong Kong', 'Macau'],
  Malaysia: ['Johor', 'Kedah', 'Kelantan', 'Malacca', 'Negeri Sembilan', 'Pahang', 'Penang', 'Perak', 'Perlis', 'Sabah', 'Sarawak', 'Selangor', 'Terengganu', 'Kuala Lumpur', 'Labuan', 'Putrajaya'],
  Nepal: ['Koshi', 'Madhesh', 'Bagmati', 'Gandaki', 'Lumbini', 'Karnali', 'Sudurpashchim'],
  'Sri Lanka': ['Western', 'Central', 'Southern', 'Northern', 'Eastern', 'North Western', 'North Central', 'Uva', 'Sabaragamuwa'],
  Indonesia: ['Jakarta', 'West Java', 'Central Java', 'East Java', 'Banten', 'Bali', 'North Sumatra', 'South Sumatra', 'Riau', 'Lampung', 'South Sulawesi', 'East Kalimantan', 'Yogyakarta'],
  Philippines: ['Metro Manila', 'Calabarzon', 'Central Luzon', 'Central Visayas', 'Davao Region', 'Western Visayas', 'Northern Mindanao', 'Ilocos Region', 'Bicol Region'],
}

/** Dropdown options for a country, or null when we have no list (use free text). */
const BY_CODE: Record<string, string[]> = {}
for (const [name, list] of Object.entries(REGIONS)) {
  const code = countryCode(name)
  if (code) BY_CODE[code] = list
}
BY_CODE['TR'] = REGIONS.Turkey

export function regionsFor(country?: string | null): string[] | null {
  if (!country) return null
  const code = countryCode(country)
  return (code && BY_CODE[code]) || REGIONS[country] || null
}

// Main cities per country, shown after the regions in the same dropdown (company "Province / State",
// agent "Address / Location"). A city that is also a region name is listed only once.
export const CITIES: Record<string, string[]> = {
  'Saudi Arabia': [
    'Riyadh', 'Jeddah', 'Makkah', 'Madinah', 'Dammam', 'Al Khobar', 'Dhahran', 'Jubail', 'Al Ahsa (Hofuf)', 'Qatif', 'Khafji', 'Ras Tanura',
    'Taif', 'Yanbu', 'Rabigh', 'Al Lith', 'Al Qunfudhah', 'Badr', 'Al Ula', 'Umluj', 'Al Wajh', 'Duba',
    'Tabuk', 'Abha', 'Khamis Mushait', 'Bisha', 'Sabya', 'Abu Arish', 'Najran', 'Sharurah', 'Jazan',
    'Buraidah', 'Unaizah', 'Ar Rass', 'Hail', 'Al Kharj', 'Ad Diriyah', 'Al Majmaah', 'Al Zulfi', 'Shaqra', 'Dawadmi', 'Wadi ad-Dawasir', 'Layla', 'Al Aflaj',
    'Sakaka', 'Dumat Al Jandal', 'Arar', 'Rafha', 'Turaif', 'Al Bahah', 'Baljurashi', 'Hafar Al Batin', 'Al Namas', 'Mahd Al Dhahab',
  ],
  Bangladesh: ['Dhaka', 'Chattogram', 'Sylhet', 'Rajshahi', 'Khulna', 'Barishal', 'Rangpur', 'Mymensingh', 'Narayanganj', 'Gazipur', 'Cumilla', "Cox's Bazar", 'Bogura', 'Jashore', 'Narsingdi', 'Tangail', 'Faridpur', 'Noakhali', 'Brahmanbaria', 'Dinajpur'],
  Pakistan: ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Gujranwala', 'Sialkot', 'Hyderabad', 'Sargodha', 'Bahawalpur', 'Abbottabad'],
  India: ['Mumbai', 'Delhi', 'Kolkata', 'Chennai', 'Bengaluru', 'Hyderabad', 'Ahmedabad', 'Pune', 'Kochi', 'Kozhikode', 'Lucknow', 'Jaipur', 'Patna', 'Guwahati'],
  Sudan: ['Khartoum', 'Omdurman', 'Khartoum North', 'Port Sudan', 'Kassala', 'Wad Madani', 'Al-Ubayyid', 'Nyala', 'Atbara'],
  Afghanistan: ['Kabul', 'Kandahar', 'Herat', 'Mazar-i-Sharif', 'Jalalabad', 'Kunduz'],
  Egypt: ['Cairo', 'Giza', 'Alexandria', 'Port Said', 'Suez', 'Luxor', 'Aswan', 'Mansoura', 'Tanta', 'Hurghada', 'Sharm El Sheikh'],
}

/** Regions and main cities for a country, for a dropdown with two groups. Null when the country has no list at all. */
export function placesFor(country?: string | null): { regions: string[]; cities: string[] } | null {
  const regions = regionsFor(country)
  const cities = country ? (CITIES[country] || []) : []
  if (!regions && cities.length === 0) return null
  const r = regions || []
  const lower = new Set(r.map(x => x.toLowerCase()))
  return { regions: r, cities: cities.filter(c => !lower.has(c.toLowerCase())) }
}
