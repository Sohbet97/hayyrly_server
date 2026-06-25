export const DRIVERS = [
  { id: 'd1', name: 'Myrat Hojaýew',     phone: '+993 65 70-12-33', plate: 'AG 4521 AG', car: 'Lada Priora',      status: 'on_way',   orders: 8,  rating: 4.9, balance: 420.50, city: 'Aşgabat', park: 'Merkezi',    lat: 37.9631, lng: 58.3290, color: '#0E2A4D', focus: true },
  { id: 'd2', name: 'Selim Annayew',     phone: '+993 65 41-88-02', plate: 'AG 1209 BG', car: 'Toyota Camry',     status: 'arrived',  orders: 5,  rating: 4.7, balance: 185.00, city: 'Aşgabat', park: 'Günorta',   lat: 37.9550, lng: 58.3180, color: '#C98612' },
  { id: 'd3', name: 'Resul Çaryýew',     phone: '+993 65 90-44-17', plate: 'AG 8821 CG', car: 'Hyundai Sonata',   status: 'on_way',   orders: 11, rating: 5.0, balance: 73.20,  city: 'Aşgabat', park: 'Demirgazyk',lat: 37.9700, lng: 58.3400, color: '#0E2A4D' },
  { id: 'd4', name: 'Begenç Geldiýew',   phone: '+993 65 22-09-90', plate: 'AG 3300 DG', car: 'Chevrolet Spark',  status: 'accepted', orders: 2,  rating: 4.6, balance: 310.80, city: 'Aşgabat', park: 'Günbatar',  lat: 37.9580, lng: 58.3350, color: '#5B4FC9' },
  { id: 'd5', name: 'Pirgeldi Saparow',  phone: '+993 65 11-55-72', plate: 'AG 7745 EG', car: 'Kia Rio',          status: 'online',   orders: 0,  rating: 4.8, balance: 55.40,  city: 'Aşgabat', park: 'Merkezi',   lat: 37.9501, lng: 58.3450, color: '#6A7689', idle: true },
  { id: 'd6', name: 'Aýdogdy Akmyradow', phone: '+993 65 80-21-09', plate: 'AG 1144 FG', car: 'VW Polo',          status: 'offline',  orders: 4,  rating: 4.5, balance: 920.00, city: 'Aşgabat', park: 'Günorta',   lat: 37.9620, lng: 58.3100, color: '#C24536', offline: true },
  { id: 'd7', name: 'Çary Berdiýew',     phone: '+993 65 50-13-72', plate: 'AG 2278 GG', car: 'Toyota Corolla',   status: 'completed',orders: 14, rating: 4.9, balance: 210.00, city: 'Aşgabat', park: 'Merkezi',   lat: 37.9660, lng: 58.3280, color: '#1B8F5A' },
]

export const ORDERS = [
  { id: 'HY-5001', client: 'Aýgül Meredowa',   phone: '+993 65 88-12-04', from: 'Mir 7 etrap',              to: 'Parahat 7',             district: 'Köpetdag',    driver: 'd1', price: 18.50, distance: 4.2, status: 'on_way',   eta: '14:32', created: '13:08', payType: 'cash' },
  { id: 'HY-5002', client: 'Döwran Hojaýew',    phone: '+993 65 22-77-19', from: 'Halkara howa menzili',     to: 'Berkarar söwda merkezi', district: 'Berkararlyk', driver: 'd2', price: 25.00, distance: 6.8, status: 'arrived',  eta: '14:50', created: '13:01', payType: 'cash' },
  { id: 'HY-5003', client: 'Maral Çaryýewa',    phone: '+993 65 90-04-66', from: 'Bitarap Türkmenistan ş.',  to: 'TSMI',                  district: 'Bagtyýarlyk', driver: 'd3', price: 12.00, distance: 2.9, status: 'on_way',   eta: '14:18', created: '12:54', payType: 'cash' },
  { id: 'HY-5004', client: 'Döwlet Nurlyýew',   phone: '+993 65 41-30-25', from: 'Aşgabat söwda merkezi',   to: 'Büzmeýin, Zelili köç.',  district: 'Büzmeýin',    driver: 'd4', price: 35.00, distance: 9.1, status: 'accepted', eta: '15:10', created: '12:41', payType: 'cash' },
  { id: 'HY-5005', client: 'Ogulnar Meredowa',  phone: '+993 65 70-21-88', from: 'Köpetdag stadiony',        to: 'Çandybil şaýoly 24',    district: 'Köpetdag',    driver: null, price: 9.00,  distance: 2.1, status: 'pending',  eta: '—',     created: '12:33', payType: 'cash' },
  { id: 'HY-5006', client: 'Sähra Nyýazowa',    phone: '+993 65 33-78-04', from: 'Parahat 4 etrap',          to: 'Gülüstan köçesi',        district: 'Bagtyýarlyk', driver: null, price: 11.00, distance: 2.6, status: 'pending',  eta: '—',     created: '12:21', payType: 'cash' },
  { id: 'HY-5007', client: 'Atajan Rejebow',    phone: '+993 65 12-09-44', from: 'Mir 1 etrap',              to: 'Andalyp köç. 117',      district: 'Berkararlyk', driver: 'd7', price: 14.00, distance: 3.3, status: 'completed',eta: '12:05', created: '11:18', payType: 'cash' },
  { id: 'HY-5008', client: 'Mähri Saparowa',    phone: '+993 65 87-44-11', from: 'Altyn Asyr bazary',        to: 'Görogly köç. 41',        district: 'Berkararlyk', driver: 'd5', price: 8.50,  distance: 2.0, status: 'cancelled',eta: '11:48', created: '11:02', payType: 'cash' },
]

export const PENDING_APPS = [
  { id: 'a1', name: 'Guwanç Myradow',     phone: '+993 65 78-90-01', city: 'Aşgabat',    car: 'Nissan Almera',  plate: 'AG 0701 HG', park: 'Merkezi',    submitted: '2026-06-24 14:32', status: 'pending' },
  { id: 'a2', name: 'Baýram Atagarryýew', phone: '+993 65 34-56-78', city: 'Türkmenabat', car: 'Toyota Corolla', plate: 'LB 0802 KG', park: 'Gündogar',   submitted: '2026-06-25 09:15', status: 'pending' },
  { id: 'a3', name: 'Kakageldi Hojow',    phone: '+993 65 23-45-67', city: 'Mary',        car: 'Daewoo Nexia',   plate: 'MR 0903 LG', park: 'Günorta',    submitted: '2026-06-25 11:40', status: 'pending' },
]

export const PRICING = [
  { cityId: 1, city: 'Aşgabat',     basePrice: 10,  perKm: 2.5, freeWait: 3, waitPerMin: 0.50 },
  { cityId: 2, city: 'Türkmenabat', basePrice: 8,   perKm: 2.0, freeWait: 3, waitPerMin: 0.40 },
  { cityId: 3, city: 'Mary',        basePrice: 8,   perKm: 2.0, freeWait: 3, waitPerMin: 0.40 },
  { cityId: 4, city: 'Balkanabat',  basePrice: 9,   perKm: 2.2, freeWait: 3, waitPerMin: 0.45 },
]

export const TRANSACTIONS = [
  { id: 1, driverId: 'd1', type: 'topup',     amount: 500,  note: 'Admin goşdy',   date: '2026-06-24 10:00', by: 'Admin' },
  { id: 2, driverId: 'd2', type: 'deduction', amount: 120,  note: 'Komissiýa',     date: '2026-06-24 11:30', by: 'System' },
  { id: 3, driverId: 'd1', type: 'topup',     amount: 200,  note: 'Nagt goşulma',  date: '2026-06-23 16:45', by: 'Operator 1' },
  { id: 4, driverId: 'd4', type: 'topup',     amount: 350,  note: 'Ilkinji dolduryş', date: '2026-06-22 09:00', by: 'Admin' },
]

export const ANALYTICS_DAYS = [
  { label: '11', delivered: 39, failed: 3 },
  { label: '12', delivered: 35, failed: 3 },
  { label: '13', delivered: 48, failed: 3 },
  { label: '14', delivered: 42, failed: 3 },
  { label: '15', delivered: 55, failed: 3 },
  { label: '16', delivered: 60, failed: 3 },
  { label: '17', delivered: 49, failed: 3 },
  { label: '18', delivered: 45, failed: 3 },
  { label: '19', delivered: 58, failed: 3 },
  { label: '20', delivered: 64, failed: 3 },
  { label: '21', delivered: 69, failed: 3 },
  { label: '22', delivered: 61, failed: 3 },
  { label: '23', delivered: 75, failed: 4 },
  { label: '24', delivered: 81, failed: 3 },
]
