const campuses = {
  alangilan: 'Alangilan', 'pablo-borbon': 'Pablo Borbon', lipa: 'Lipa',
  'arasof-nasugbu': 'ARASOF-Nasugbu', 'jplpc-malvar': 'JPLPC-Malvar',
  lima: 'Lima', balayan: 'Balayan', lemery: 'Lemery', rosario: 'Rosario',
  'san-juan': 'San Juan', mabini: 'Mabini', lobo: 'Lobo'
};

const amenities = ['Wi-Fi', 'Air conditioning', 'Laundry area', 'Kitchen', 'Study area', 'Bike parking', 'Private bathroom', 'Shared bathroom', 'Water included', 'Lockers', 'Covered drying area'];
const roomTypes = ['Private room', 'Double occupancy', 'Shared room', 'Bedspace'];
const propertyTypes = ['Dormitory', 'Boarding House'];
const genderPolicies = ['Female only', 'Male only', 'Co-ed'];
const availabilityOptions = ['Available', 'Limited slots', 'Fully occupied', 'Availability unconfirmed'];

const properties = [
  {
    id: 'spartan-study-residence', name: 'Spartan Study Residence', campus: 'alangilan',
    area: 'Alangilan', city: 'Batangas City', distance: 0.6, type: 'Dormitory',
    rent: 2800, basis: 'bedspace', room: '4-person shared room', arrangement: 'Shared room',
    gender: 'Female only', capacity: 4, occupied: 1, slots: 3, status: 'Available',
    features: ['Wi-Fi', 'Study area', 'Water included', 'Air conditioning', 'Laundry area', 'Kitchen', 'Shared bathroom'],
    cooling: 'Air conditioning and fans', owner: 'Marina Dela Cruz', contact: 'SMS · 9 AM–6 PM',
    description: 'A four-bed dorm with a quiet study area and a shared kitchen. Each resident gets a desk shelf and storage under their bunk.',
    included: 'Water and shared Wi-Fi', extras: 'Electricity split among occupants. Cooking gas is shared.',
    advance: 2800, deposit: 2800, rules: 'Quiet hours begin at 10 PM. Visitors may use the common area until 8 PM.',
    location: 'Sample location near the Alangilan campus gate', photo: 'spartan'
  },
  {
    id: 'acacia-student-boarding-house', name: 'Acacia Student Boarding House', campus: 'alangilan',
    area: 'Alangilan', city: 'Batangas City', distance: 0.8, type: 'Boarding House',
    rent: 3250, basis: 'person', room: 'Twin room with individual desks', arrangement: 'Double occupancy',
    gender: 'Male only', capacity: 2, occupied: 1, slots: 1, status: 'Limited slots',
    features: ['Wi-Fi', 'Kitchen', 'Laundry area', 'Shared bathroom', 'Bike parking'],
    cooling: 'Wall-mounted fans', owner: 'Joel Villanueva', contact: 'Phone · Weekdays after 4 PM',
    description: 'A twin room with two single beds, individual desks, and space for bicycles. Residents share a kitchen and laundry corner.',
    included: 'Wi-Fi and a basic electricity allowance', extras: 'Water and electricity above the allowance are billed monthly.',
    advance: 0, deposit: 3250, rules: 'Keep the shared kitchen clean. Overnight guests require permission.',
    location: 'Sample location off the Alangilan main road', photo: 'acacia'
  },
  {
    id: 'tahanan-study-house', name: 'Tahanan Study House', campus: 'alangilan',
    area: 'Balagtas', city: 'Batangas City', distance: 0.9, type: 'Boarding House',
    rent: 2400, basis: 'bedspace', room: '4-bed room with shared cabinets', arrangement: 'Bedspace',
    gender: 'Co-ed', capacity: 4, occupied: null, slots: null, status: 'Availability unconfirmed',
    features: ['Kitchen', 'Shared bathroom', 'Lockers', 'Covered drying area'],
    cooling: 'Ceiling fan', owner: 'Nerissa Aguilar', contact: 'SMS · Saturdays and Sundays',
    description: 'A budget bedspace with a personal locker and access to a covered drying area. The shared kitchen has a basic prep counter.',
    included: 'Water and use of shared kitchen', extras: 'Electricity is split monthly. Internet is arranged by tenants.',
    advance: 2400, deposit: 1200, rules: 'Label food in the kitchen. The gate closes at 11 PM.',
    location: 'Sample location near the Balagtas jeepney route', photo: 'tahanan'
  },
  {
    id: 'mabini-student-rooms', name: 'Mabini Student Rooms', campus: 'alangilan',
    area: 'Kumintang Ilaya', city: 'Batangas City', distance: 1.4, type: 'Dormitory',
    rent: 5100, basis: 'room', room: 'Solo room with a private bathroom', arrangement: 'Private room',
    gender: 'Co-ed', capacity: 1, occupied: 1, slots: 0, status: 'Fully occupied',
    features: ['Wi-Fi', 'Air conditioning', 'Private bathroom', 'Study area'],
    cooling: 'Window air conditioner', owner: 'Rafael Mendoza', contact: 'Phone · 10 AM–5 PM',
    description: 'A quiet solo room with a desk by the window and a private bathroom. The room is currently occupied.',
    included: 'Wi-Fi and water', extras: 'Electricity is billed through a room submeter.',
    advance: 5100, deposit: 5100, rules: 'Visitors sign in at the entrance. Cooking pots and open flames stay in the common kitchen.',
    location: 'Sample location near the Kumintang Ilaya neighborhood road', photo: 'mabini'
  },
  {
    id: 'casa-maharlika-boarding-house', name: 'Casa Maharlika Boarding House', campus: 'pablo-borbon',
    area: 'Kumintang Ibaba', city: 'Batangas City', distance: 0.8, type: 'Boarding House',
    rent: 3500, basis: 'person', room: '2-person shared room', arrangement: 'Double occupancy',
    gender: 'Male only', capacity: 2, occupied: 0, slots: 2, status: 'Limited slots',
    features: ['Wi-Fi', 'Kitchen', 'Bike parking', 'Shared bathroom', 'Lockers'],
    cooling: 'Portable fans', owner: 'Paolo Macaraig', contact: 'SMS · 8 AM–7 PM',
    description: 'A furnished twin room in a small boarding house with a shared kitchen, covered bicycle racks, and lockable storage.',
    included: 'Shared Wi-Fi and bicycle parking', extras: 'Water, electricity, and cooking gas are split monthly.',
    advance: 3500, deposit: 2000, rules: 'Cooking is allowed in the kitchen until 9 PM. Quiet hours begin at 10 PM.',
    location: 'Sample location near the Kumintang Ibaba transit stop', photo: 'maharlika'
  },
  {
    id: 'the-study-nook-dormitory', name: 'The Study Nook Dormitory', campus: 'lipa',
    area: 'Balintawak', city: 'Lipa City', distance: 1.2, type: 'Dormitory',
    rent: 5500, basis: 'room', room: 'Private room for 1–2 people', arrangement: 'Private room',
    gender: 'Co-ed', capacity: 2, occupied: 0, slots: 1, status: 'Limited slots',
    features: ['Wi-Fi', 'Air conditioning', 'Private bathroom', 'Covered drying area'],
    cooling: 'Split-type air conditioning', owner: 'Althea Dimaculangan', contact: 'Email · Replies on weekdays',
    description: 'A private room for one or two tenants with a full-size desk, its own bathroom, and access to a covered drying area.',
    included: 'Fiber Wi-Fi, water, and common-area cleaning', extras: 'Metered room electricity and optional laundry service.',
    advance: 5500, deposit: 4500, rules: 'Viewing by appointment. Small pets require prior approval.',
    location: 'Sample location near the Balintawak market route', photo: 'study-nook'
  }
];

const pesos = new Intl.NumberFormat('en-PH', {
  style: 'currency', currency: 'PHP', maximumFractionDigits: 0
});
const money = amount => pesos.format(amount);
const campusName = campus => 'BatStateU ' + campuses[campus];
const roomPhoto = property => 'assets/properties/' + property.photo + '.jpg';

function slotLabel(property) {
  if (property.slots === null) return 'Ask the owner about availability';
  if (property.slots === 0) return 'No open slots';
  if (property.basis === 'room') return property.slots === 1 ? '1 room available' : property.slots + ' rooms available';
  return property.slots === 1 ? '1 slot available' : property.slots + ' slots available';
}

function addOptions(select, options) {
  for (const [value, label] of options) select.add(new Option(label, value));
}
