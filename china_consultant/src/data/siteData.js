// ============================================
// Site Data - China Visa Service Consultancy
// ============================================

export const COMPANY = {
  name: 'China Visa Service Consultancy Pvt. Ltd.',
  shortName: 'China Visa Service',
  tagline: 'Pioneer in China Visa and Travel Documentation',
  description:
    'China Visa Service Consultancy Pvt. Ltd. has been a trusted name in visa processing services since 2066 B.S., helping individuals and businesses complete their travel documentation smoothly and confidently.',
  foundedYear: '2066 B.S.',
  phone: '9851014899',
  email: 'info@chinavisaservice.com.np',
  whatsapp: '+977 985-1014899',
  address: 'Hattisar, Kathmandu',
  officeHours: 'Sun-Fri: 10:00 AM - 5:00 PM',
};

export const NAV_LINKS = [
  { label: 'Home', href: '#hero' },
  { label: 'Countries', href: '#countries' },
  { label: 'Services', href: '#services' },
  { label: 'Appointment', href: '#appointment' },
  { label: 'FAQ', href: '#faq' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
];

export const TRUST_STATS = [
  { value: 15, suffix: '+', label: 'Years of Experience' },
  { value: 10000, suffix: '+', label: 'Clients Served' },
  { value: 3, suffix: '', label: 'Countries Supported' },
  { value: 98, suffix: '%', label: 'Success Rate' },
];

export const COUNTRIES = [
  {
    id: 'china',
    name: 'China',
    flag: '🇨🇳',
    description:
      'Our flagship service. We are the pioneer in China visa application services in Nepal, offering expert guidance for all visa categories.',
    visaTypes: ['Tourist (L)', 'Business (M)', 'Student (X)', 'Family (Q)', 'Transit (G)'],
    image: '/images/destinations/shanghai-generated.png',
    featured: true,
    eligibleNationalities: ['Nepal', 'India', 'Pakistan', 'Bangladesh', 'Sri Lanka', 'Other Countries'],
  },
  {
    id: 'japan',
    name: 'Japan',
    flag: '🇯🇵',
    description:
      'Professional visa processing services for Japan, including tourist, business, and student visas with thorough documentation support.',
    visaTypes: ['Tourist', 'Business', 'Student', 'Transit'],
    image: '/images/destinations/tokyo-generated.png',
    featured: false,
    eligibleNationalities: ['Nepal', 'India', 'Bangladesh', 'Sri Lanka'],
  },
  {
    id: 'south-korea',
    name: 'South Korea',
    flag: '🇰🇷',
    description:
      'Comprehensive visa application support for South Korea, ensuring accurate paperwork and timely submission for all visa categories.',
    visaTypes: ['Tourist', 'Business', 'Student', 'Working Holiday'],
    image: '/images/destinations/seoul-generated.png',
    featured: false,
    eligibleNationalities: ['Nepal', 'India', 'Bangladesh', 'Pakistan'],
  },
];

export const CITIES = [
  {
    id: 'shanghai',
    name: 'Shanghai',
    country: 'China',
    description: "The Pearl of the Orient - China's largest city and global financial hub with stunning modern architecture.",
    image: '/images/destinations/shanghai-generated.png',
  },
  {
    id: 'beijing',
    name: 'Beijing',
    country: 'China',
    description: "China's capital city, home to the Forbidden City, Tiananmen Square, and rich imperial history.",
    image: '/images/destinations/beijing-generated.png',
  },
  {
    id: 'great-wall',
    name: 'Great Wall',
    country: 'China',
    description: 'One of the greatest wonders of the world, stretching over 13,000 miles across northern China.',
    image: '/images/destinations/great-wall-generated.png',
  },
  {
    id: 'guangzhou',
    name: 'Guangzhou',
    country: 'China',
    description: 'A vibrant metropolis in southern China, known for its Canton Tower and rich Cantonese culture.',
    image: '/images/destinations/guangzhou.png',
  },
  {
    id: 'shenzhen',
    name: 'Shenzhen',
    country: 'China',
    description: "China's tech capital and a modern miracle of rapid urban development bordering Hong Kong.",
    image: '/images/destinations/shenzhen.png',
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    country: 'Japan',
    description: "Japan's bustling capital blending ultramodern technology with traditional temples and gardens.",
    image: '/images/destinations/tokyo-generated.png',
  },
  {
    id: 'seoul',
    name: 'Seoul',
    country: 'South Korea',
    description: 'A dynamic capital where ancient palaces stand alongside cutting-edge technology and K-culture.',
    image: '/images/destinations/seoul-generated.png',
  },
];

export const SERVICES = [
  {
    icon: 'TV',
    title: 'Tourist Visa',
    description: 'Complete assistance for leisure and sightseeing visa applications with documentation support.',
  },
  {
    icon: 'BZ',
    title: 'Business Visa',
    description: 'Professional visa processing for business travelers, trade delegates, and corporate representatives.',
  },
  {
    icon: 'ST',
    title: 'Student Visa',
    description: 'Comprehensive support for students seeking to study abroad with scholarship and university guidance.',
  },
  {
    icon: 'FM',
    title: 'Family Reunion Visa',
    description: 'Expert assistance for family reunion and dependent visa applications with proper documentation.',
  },
  {
    icon: 'TR',
    title: 'Transit Visa',
    description: 'Quick processing for transit visa requirements for travelers passing through supported countries.',
  },
  {
    icon: 'DV',
    title: 'Document Verification',
    description: 'Professional verification and authentication of all required travel and visa documents.',
  },
  {
    icon: 'TS',
    title: 'Tailored Service',
    description: 'Personalized visa and travel documentation support designed around each client\'s exact purpose, timeline, and paperwork needs.',
  },
];

export const PROCESS_STEPS = [
  {
    step: 1,
    title: 'Consultation',
    description: 'Schedule a free consultation to discuss your travel plans and visa requirements.',
    icon: '01',
  },
  {
    step: 2,
    title: 'Document Collection',
    description: 'Our experts guide you through the required documents and help prepare your application.',
    icon: '02',
  },
  {
    step: 3,
    title: 'Application Submission',
    description: 'We submit your completed application to the appropriate embassy or visa center.',
    icon: '03',
  },
  {
    step: 4,
    title: 'Visa Processing',
    description: 'Track your application status with real-time updates from our processing team.',
    icon: '04',
  },
  {
    step: 5,
    title: 'Approval & Delivery',
    description: 'Receive your approved visa and travel with confidence knowing everything is in order.',
    icon: '05',
  },
];

export const WHY_CHOOSE_US = [
  {
    icon: 'A1',
    title: 'Pioneer in China Visa',
    description: 'The first and most trusted China visa consultancy in Nepal since 2066 B.S.',
  },
  {
    icon: 'UP',
    title: 'Updated Embassy Requirements',
    description: 'We stay current with the latest embassy regulations and visa policy changes.',
  },
  {
    icon: 'TM',
    title: 'Professional Support',
    description: 'Our experienced team provides personalized guidance at every step of your application.',
  },
  {
    icon: 'TR',
    title: 'Transparent Process',
    description: 'No hidden fees, no surprises - complete transparency in our service delivery.',
  },
  {
    icon: 'PG',
    title: 'Personalized Guidance',
    description: 'Tailored solutions based on your specific travel needs and visa requirements.',
  },
  {
    icon: 'FX',
    title: 'Fast & Efficient',
    description: 'Streamlined processes to ensure your visa application is processed as quickly as possible.',
  },
];

export const TEAM_MEMBERS = [
  {
    name: 'Rajesh Sharma',
    role: 'Visa Documentation Specialist',
    description: 'Expert in Chinese visa documentation with over 10 years of experience.',
  },
  {
    name: 'Anita Thapa',
    role: 'Application Processing Officer',
    description: 'Specialized in processing complex visa applications efficiently.',
  },
  {
    name: 'Sunil Maharjan',
    role: 'Customer Support Officer',
    description: 'Dedicated to providing excellent client communication and support.',
  },
  {
    name: 'Priya Adhikari',
    role: 'Travel Documentation Consultant',
    description: 'Comprehensive travel planning and documentation expertise.',
  },
];

export const MILESTONES = [
  { year: '2066 B.S.', title: 'Founded', description: 'China Visa Service Consultancy established in Kathmandu.' },
  { year: '2068 B.S.', title: 'Japan Visa Services', description: 'Expanded services to include Japan visa processing.' },
  { year: '2070 B.S.', title: 'South Korea Added', description: 'Added South Korea visa services to our portfolio.' },
  { year: '2073 B.S.', title: '5000+ Clients', description: 'Reached milestone of serving over 5,000 satisfied clients.' },
  { year: '2078 B.S.', title: 'Digital Transformation', description: 'Launched online application tracking and digital services.' },
  { year: '2081 B.S.', title: '10,000+ Clients', description: 'Proudly serving over 10,000 clients with continued excellence.' },
];

export const TESTIMONIALS = [
  {
    name: 'Bikash Gurung',
    role: 'Business Traveler',
    text: 'Excellent service! They made my China business visa process incredibly smooth. The team was professional and kept me updated at every step.',
    rating: 5,
  },
  {
    name: 'Srijana Tamang',
    role: 'Student',
    text: 'I got my student visa for Beijing University with their help. Very knowledgeable about the requirements and very supportive throughout.',
    rating: 5,
  },
  {
    name: 'Hari Prasad Pokharel',
    role: 'Tourist',
    text: 'Best visa consultancy for China visa in Nepal. They handled everything professionally and my visa was approved without any issues.',
    rating: 5,
  },
  {
    name: 'Anup Shrestha',
    role: 'Business Owner',
    text: 'I have been using their services for multiple trips to China and Japan. Consistent quality and reliable service every time.',
    rating: 4,
  },
];

export const FAQS = [
  {
    question: 'What documents are required for a China tourist visa?',
    answer:
      'For a China tourist visa (L visa), you typically need: a valid passport (with at least 6 months validity), completed visa application form, recent passport-size photos, confirmed flight itinerary, hotel booking confirmation, proof of financial means, and travel insurance. Our team will guide you through the exact requirements based on your specific situation.',
  },
  {
    question: 'How long does the visa processing take?',
    answer:
      "Standard processing for a China visa takes approximately 4-5 working days after submission. Express processing (1-2 days) is available at an additional fee. Processing times may vary based on the embassy's workload and your specific visa category.",
  },
  {
    question: 'Do you handle business visa applications?',
    answer:
      'Yes, we specialize in business visa (M visa) applications for China. We assist with invitation letters, company documentation, and all required paperwork for business travelers and trade delegates.',
  },
  {
    question: 'What countries do you provide visa services for?',
    answer:
      'We provide visa application services for China, Japan, and South Korea. China visa services are our primary specialty, being the pioneer in China visa application services in Nepal.',
  },
  {
    question: 'Can I track my visa application status?',
    answer:
      'Yes, we provide regular updates on your visa application status via phone and email. You can also contact our office directly anytime for the latest update on your file.',
  },
  {
    question: 'What are your office hours?',
    answer:
      'Our office is open Sunday through Friday, from 10:00 AM to 5:00 PM (Nepal Standard Time). Saturday is a public holiday. You can also reach us via WhatsApp for urgent inquiries outside office hours.',
  },
  {
    question: 'Do I need to visit your office in person?',
    answer:
      'An initial consultation can be done over the phone or via email. However, for document submission and biometric purposes, you will need to visit our office. We will guide you on exactly when your presence is required.',
  },
  {
    question: 'What is the cost of your visa processing service?',
    answer:
      'Our service fees vary depending on the visa type, country, and processing speed. We maintain full transparency in our pricing - contact us for a detailed fee breakdown specific to your visa category. There are no hidden charges.',
  },
];

export const CHATBOT_RESPONSES = {
  greeting: "Hello! I'm the China Visa Assistant. How can I help you with your visa application today?",
  default:
    'Thank you for your question. For detailed assistance, please contact our office at our phone number or email. Our team will be happy to help you.',
  keywords: {
    china: 'China is our primary specialty! We offer Tourist (L), Business (M), Student (X), Family (Q), and Transit (G) visa services. Would you like to know the requirements for a specific visa type?',
    japan: 'We provide comprehensive Japan visa services including Tourist, Business, Student, and Transit visas. Our team can guide you through the specific requirements.',
    korea: 'We offer South Korea visa services including Tourist, Business, Student, and Working Holiday visas. Contact us for detailed requirements.',
    tourist: "For a tourist visa, you'll typically need: valid passport, completed application form, passport photos, flight itinerary, hotel booking, financial proof, and travel insurance. The exact requirements vary by country.",
    business: "For a business visa, you'll need: valid passport, invitation letter from the hosting company, company registration documents, and other supporting documents. We can help prepare all required paperwork.",
    student: "For a student visa, you'll need: university admission letter, passport, financial proof, academic transcripts, and other documents. We provide complete guidance for student visa applications.",
    document: "Required documents vary by visa type and country. Generally, you'll need: valid passport, photos, application form, and supporting documents. Visit our office for a personalized document checklist.",
    cost: 'Our service fees vary by visa type and processing speed. We maintain complete transparency - contact us for a detailed fee breakdown. No hidden charges!',
    time: 'Standard processing takes 4-5 working days. Express processing (1-2 days) is available at additional cost. Processing times may vary based on the embassy workload.',
    office: 'Our office is located in Hattisar, Kathmandu. We are open Sunday through Friday, 10:00 AM to 5:00 PM. You can also reach us via WhatsApp for urgent inquiries.',
    track: 'You can track your application status by contacting our office. We also provide regular updates via phone and email.',
    hello: 'Hello! Welcome to China Visa Service Consultancy. How can I assist you today?',
    hi: 'Hi there! Welcome to China Visa Service Consultancy. How can I help you with your visa needs?',
    thanks: "You're welcome! If you have any more questions, feel free to ask. We're here to help!",
    help: 'I can help you with information about our visa services, required documents, processing times, and more. What would you like to know?',
  },
};

export const GALLERY_IMAGES = [
  { src: '/images/destinations/shanghai-generated.png', alt: 'Shanghai Skyline', location: 'Shanghai, China' },
  { src: '/images/destinations/great-wall-generated.png', alt: 'Great Wall of China', location: 'Beijing, China' },
  { src: '/images/destinations/forbidden-city.png', alt: 'Forbidden City', location: 'Beijing, China' },
  { src: '/images/destinations/beijing-generated.png', alt: 'Beijing Cityscape', location: 'Beijing, China' },
  { src: '/images/destinations/guangzhou.png', alt: 'Guangzhou City', location: 'Guangzhou, China' },
  { src: '/images/destinations/shenzhen.png', alt: 'Shenzhen Skyline', location: 'Shenzhen, China' },
  { src: '/images/destinations/tokyo-generated.png', alt: 'Tokyo Night View', location: 'Tokyo, Japan' },
  { src: '/images/destinations/mount-fuji-generated.png', alt: 'Mount Fuji', location: 'Fuji, Japan' },
  { src: '/images/destinations/seoul-generated.png', alt: 'Seoul Cityscape', location: 'Seoul, South Korea' },
];
