"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

interface CitySearchProps {
  selectedState: string
  onCitySelect: (city: string) => void
  value: string
}

// Sample Indian cities data - in a real app, this would come from an API
const INDIAN_CITIES_DATA: Record<string, string[]> = {
  "Andhra Pradesh": [
    "Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Rajahmundry", "Tirupati", "Kadapa", "Kakinada", "Anantapur",
    "Vizianagaram", "Eluru", "Ongole", "Nandyal", "Machilipatnam", "Adoni", "Tenali", "Chittoor", "Hindupur", "Proddatur"
  ],
  "Arunachal Pradesh": [
    "Itanagar", "Naharlagun", "Pasighat", "Tezpur", "Bomdila", "Ziro", "Along", "Changlang", "Tezu", "Khonsa",
    "Namsai", "Yingkiong", "Roing", "Anini", "Longding", "Seppa", "Daporijo", "Basar", "Koloriang", "Tawang"
  ],
  "Assam": [
    "Guwahati", "Dibrugarh", "Silchar", "Jorhat", "Nagaon", "Tinsukia", "Tezpur", "Bongaigaon", "Karimganj", "Sivasagar",
    "Goalpara", "Barpeta", "North Lakhimpur", "Mangaldoi", "Nalbari", "Rangia", "Diphu", "Haflong", "Kokrajhar", "Dhubri"
  ],
  "Bihar": [
    "Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga", "Bihar Sharif", "Arrah", "Begusarai", "Katihar", "Munger",
    "Chapra", "Danapur", "Saharsa", "Sasaram", "Hajipur", "Dehri", "Siwan", "Motihari", "Nawada", "Bagaha"
  ],
  "Chhattisgarh": [
    "Raipur", "Bhilai", "Korba", "Bilaspur", "Durg", "Rajnandgaon", "Jagdalpur", "Raigarh", "Ambikapur", "Mahasamund",
    "Dhamtari", "Chirmiri", "Janjgir", "Sakti", "Kanker", "Kawardha", "Narayanpur", "Bastar", "Kondagaon", "Sukma"
  ],
  "Goa": [
    "Panaji", "Vasco da Gama", "Margao", "Mapusa", "Ponda", "Bicholim", "Curchorem", "Sanquelim", "Valpoi", "Pernem",
    "Quepem", "Canacona", "Sanguem", "Aldona", "Arambol", "Anjuna", "Calangute", "Candolim", "Baga", "Morjim"
  ],
  "Gujarat": [
    "Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Junagadh", "Gandhinagar", "Anand", "Navsari",
    "Morbi", "Nadiad", "Surendranagar", "Bharuch", "Mehsana", "Bhuj", "Porbandar", "Palanpur", "Valsad", "Vapi"
  ],
  "Haryana": [
    "Faridabad", "Gurgaon", "Panipat", "Ambala", "Yamunanagar", "Rohtak", "Hisar", "Karnal", "Sonipat", "Panchkula",
    "Bhiwani", "Sirsa", "Bahadurgarh", "Jind", "Thanesar", "Kaithal", "Rewari", "Narnaul", "Pundri", "Kosli"
  ],
  "Himachal Pradesh": [
    "Shimla", "Mandi", "Solan", "Nahan", "Una", "Kullu", "Hamirpur", "Bilaspur", "Chamba", "Dharamshala",
    "Palampur", "Baddi", "Nalagarh", "Parwanoo", "Kasauli", "Manali", "Dalhousie", "Keylong", "Reckong Peo", "Kalpa"
  ],
  "Jharkhand": [
    "Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar", "Phusro", "Hazaribagh", "Giridih", "Ramgarh", "Medininagar",
    "Chirkunda", "Chaibasa", "Gumla", "Dumka", "Godda", "Sahebganj", "Pakur", "Jamtara", "Koderma", "Lohardaga"
  ],
  "Karnataka": [
    "Bangalore", "Mysore", "Hubli", "Mangalore", "Belgaum", "Gulbarga", "Davanagere", "Bellary", "Bijapur", "Shimoga",
    "Tumkur", "Raichur", "Bidar", "Hospet", "Hassan", "Gadag", "Udupi", "Robertsonpet", "Bhadravati", "Chitradurga"
  ],
  "Kerala": [
    "Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Palakkad", "Alappuzha", "Malappuram", "Kannur", "Kasaragod",
    "Kottayam", "Pathanamthitta", "Idukki", "Wayanad", "Ernakulam", "Munnar", "Thekkady", "Varkala", "Kovalam", "Bekal"
  ],
  "Madhya Pradesh": [
    "Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Dewas", "Satna", "Ratlam", "Rewa",
    "Katni", "Singrauli", "Burhanpur", "Khandwa", "Bhind", "Chhindwara", "Guna", "Shivpuri", "Vidisha", "Chhatarpur"
  ],
  "Maharashtra": [
    "Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Solapur", "Amravati", "Kolhapur", "Sangli",
    "Jalgaon", "Akola", "Latur", "Ahmednagar", "Chandrapur", "Parbhani", "Ichalkaranji", "Jalna", "Ambajogai", "Bhusawal"
  ],
  "Manipur": [
    "Imphal", "Thoubal", "Bishnupur", "Churachandpur", "Ukhrul", "Senapati", "Tamenglong", "Chandel", "Jiribam", "Kangpokpi",
    "Tengnoupal", "Pherzawl", "Noney", "Kamjong", "Kakching", "Moirang", "Mayang", "Yairipok", "Nambol", "Sekmai"
  ],
  "Meghalaya": [
    "Shillong", "Tura", "Jowai", "Nongpoh", "Baghmara", "Williamnagar", "Nongstoin", "Mawkyrwat", "Resubelpara", "Ampati",
    "Khliehriat", "Mairang", "Mawsynram", "Cherrapunji", "Dawki", "Bholaganj", "Amlarem", "Ranikor", "Mawphlang", "Sohra"
  ],
  "Mizoram": [
    "Aizawl", "Lunglei", "Saiha", "Champhai", "Kolasib", "Serchhip", "Mamit", "Lawngtlai", "Saitual", "Khawzawl",
    "Hnahthial", "Bairabi", "North Vanlaiphai", "Tlabung", "Zawlnuam", "Darlawn", "Thenzawl", "Lengpui", "Vairengte", "Tuipang"
  ],
  "Nagaland": [
    "Kohima", "Dimapur", "Mokokchung", "Tuensang", "Wokha", "Zunheboto", "Phek", "Kiphire", "Longleng", "Peren",
    "Mon", "Noklak", "Chumukedima", "Tuli", "Pfutsero", "Longkhim", "Tizit", "Aboi", "Changtongya", "Ungma"
  ],
  "Odisha": [
    "Bhubaneswar", "Cuttack", "Rourkela", "Brahmapur", "Sambalpur", "Puri", "Balasore", "Bhadrak", "Baripada", "Jharsuguda",
    "Jeypore", "Barbil", "Khordha", "Bolangir", "Rayagada", "Kendujhar", "Sundargarh", "Parlakhemundi", "Talcher", "Dhenkanal"
  ],
  "Punjab": [
    "Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Firozpur", "Batala", "Pathankot", "Hoshiarpur",
    "Moga", "Malerkotla", "Khanna", "Phagwara", "Muktsar", "Barnala", "Rajpura", "Kapurthala", "Faridkot", "Sunam"
  ],
  "Rajasthan": [
    "Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer", "Udaipur", "Bhilwara", "Alwar", "Bharatpur", "Sikar",
    "Pali", "Sri Ganganagar", "Kishangarh", "Baran", "Dhaulpur", "Tonk", "Beawar", "Hanumangarh", "Gangapur City", "Banswara"
  ],
  "Sikkim": [
    "Gangtok", "Namchi", "Gyalshing", "Mangan", "Jorethang", "Nayabazar", "Singtam", "Rangpo", "Pakyong", "Ravangla",
    "Yuksom", "Pelling", "Lachung", "Lachen", "Rhenock", "Soreng", "Chungthang", "Melli", "Kalimpong", "Ranipool"
  ],
  "Tamil Nadu": [
    "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Tiruppur", "Vellore", "Erode", "Thoothukkudi",
    "Dindigul", "Thanjavur", "Ranipet", "Sivakasi", "Karur", "Udhagamandalam", "Hosur", "Nagercoil", "Kanchipuram", "Kumarakonam"
  ],
  "Telangana": [
    "Hyderabad", "Warangal", "Nizamabad", "Khammam", "Karimnagar", "Ramagundam", "Mahabubnagar", "Nalgonda", "Adilabad", "Suryapet",
    "Miryalaguda", "Jagtial", "Mancherial", "Nirmal", "Kothagudem", "Bodhan", "Sangareddy", "Metpally", "Zahirabad", "Kamareddy"
  ],
  "Tripura": [
    "Agartala", "Dharmanagar", "Udaipur", "Kailashahar", "Belonia", "Khowai", "Bishramganj", "Teliamura", "Sonamura", "Sabroom",
    "Kamalpur", "Ambassa", "Ranirbazar", "Kumarghat", "Panisagar", "Longtharai", "Jirania", "Mohanpur", "Melaghar", "Gandacherra"
  ],
  "Uttar Pradesh": [
    "Lucknow", "Kanpur", "Ghaziabad", "Agra", "Meerut", "Varanasi", "Allahabad", "Bareilly", "Aligarh", "Moradabad",
    "Saharanpur", "Gorakhpur", "Noida", "Firozabad", "Jhansi", "Muzaffarnagar", "Mathura", "Rampur", "Shahjahanpur", "Farrukhabad"
  ],
  "Uttarakhand": [
    "Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rudrapur", "Kashipur", "Rishikesh", "Pithoragarh", "Jaspur", "Kichha",
    "Mussoorie", "Nainital", "Almora", "Pauri", "Bageshwar", "Champawat", "Rudraprayag", "Tehri", "Uttarkashi", "Chamoli"
  ],
  "West Bengal": [
    "Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Bardhaman", "Malda", "Baharampur", "Habra", "Kharagpur",
    "Shantipur", "Dankuni", "Dhulian", "Ranaghat", "Haldia", "Raiganj", "Krishnanagar", "Nabadwip", "Medinipur", "Jalpaiguri"
  ],
  "Delhi": [
    "New Delhi", "Delhi", "Dwarka", "Rohini", "Janakpuri", "Lajpat Nagar", "Karol Bagh", "Connaught Place", "Saket", "Vasant Kunj",
    "Pitampura", "Rajouri Garden", "Laxmi Nagar", "Preet Vihar", "Mayur Vihar", "Kalkaji", "Nehru Place", "Greater Kailash", "Defence Colony", "Khan Market"
  ]
}

export function CitySearch({ selectedState, onCitySelect, value }: CitySearchProps) {
  const [searchTerm, setSearchTerm] = useState(value)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { t } = useLanguage()

  useEffect(() => {
    setSearchTerm(value)
  }, [value])

  useEffect(() => {
    if (searchTerm.length > 0 && selectedState) {
      const cities = INDIAN_CITIES_DATA[selectedState] || []
      const filtered = cities
        .filter(city => 
          city.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .slice(0, 5)
      setSuggestions(filtered)
      setShowSuggestions(true)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [searchTerm, selectedState])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
  }

  const handleCitySelect = (city: string) => {
    setSearchTerm(city)
    onCitySelect(city)
    setShowSuggestions(false)
  }

  const handleInputFocus = () => {
    if (searchTerm.length > 0) {
      setShowSuggestions(true)
    }
  }

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow click events
    setTimeout(() => {
      setShowSuggestions(false)
    }, 200)
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={selectedState ? `${t('institution.searchCity')} ${selectedState}...` : t('institution.selectStateFirst')}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          disabled={!selectedState}
          className="h-12 pl-10 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 text-base"
          style={{color: '#212153'}}
        />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((city, index) => (
            <button
              key={index}
              type="button"
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150 first:rounded-t-xl last:rounded-b-xl"
              onClick={() => handleCitySelect(city)}
              style={{color: '#212153'}}
            >
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                <span>{city}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedState && searchTerm.length > 0 && suggestions.length === 0 && showSuggestions && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg">
          <div className="px-4 py-3 text-gray-500 text-sm">
            {t('cities.noResults')} "{searchTerm}" {t('cities.in')} {selectedState}
          </div>
        </div>
      )}
    </div>
  )
}