import { 
  Request, 
  Offer, 
  CustomerRequestLog,
  PartnerDocument,
  ReviewObjection,
  SupportTicket,
  PartnerVehicle,
  CreditTransaction,
  PartnerCredit,
  EmptyTruckRoute,
  PartnerReview,
  CompletedJob
} from '../types';

// ============================================
// LOCAL STORAGE KEYS
// ============================================

const LS_KEYS = {
  requests: 'yolmov_requests',
  offers: 'yolmov_offers',
  documents: 'yolmov_documents',
  objections: 'yolmov_objections',
  tickets: 'yolmov_tickets',
  vehicles: 'yolmov_vehicles',
  credits: 'yolmov_credits',
  creditTransactions: 'yolmov_credit_transactions',
  routes: 'yolmov_routes',
  reviews: 'yolmov_reviews',
  jobs: 'yolmov_jobs',
  users: 'yolmov_users',
  partners: 'yolmov_partners',
  leadRequests: 'yolmov_lead_requests',
  areaRequests: 'yolmov_area_requests',
  initialized: 'yolmov_initialized'
};

function load<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

function genId(prefix: string) {
  return prefix + '-' + Math.random().toString(36).slice(2, 9);
}

// ============================================
// USERS & PARTNERS (Admin View)
// ============================================

export interface User {
  id: string; name: string; email: string;
  type: 'customer' | 'partner'; status: 'active' | 'suspended'; joinDate: string;
  totalSpent?: number; totalEarned?: number;
}

export interface Partner {
  id: string; name: string; email: string; phone: string; rating: number;
  completedJobs: number; credits: number; status: 'active' | 'pending' | 'suspended';
}

export function getAllUsers(): User[] {
  return load<User>(LS_KEYS.users);
}

export function getAllPartners(): Partner[] {
  return load<Partner>(LS_KEYS.partners);
}

// ============================================
// PARTNER REQUESTS (Lead & Area)
// ============================================

export interface PartnerLeadRequest {
  id: string;
  partnerId: string;
  partnerName: string;
  requestType: 'lead_purchase';
  serviceArea: string;
  serviceType: string;
  creditCost: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  adminNotes?: string;
  customerInfo?: {
    name: string;
    phone: string;
    location: string;
  };
}

export interface ServiceAreaRequest {
  id: string;
  partnerId: string;
  partnerName: string;
  requestType: 'area_expansion';
  currentAreas: string[];
  requestedAreas: string[];
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  adminNotes?: string;
}

export function getAllLeadRequests(): PartnerLeadRequest[] {
  return load<PartnerLeadRequest>(LS_KEYS.leadRequests);
}

export function getAllAreaRequests(): ServiceAreaRequest[] {
  return load<ServiceAreaRequest>(LS_KEYS.areaRequests);
}

// REQUESTS
export function createMockRequest(partial: Omit<Request, 'id' | 'createdAt' | 'status'> & { status?: Request['status'] }): Request {
  const requests = load<Request>(LS_KEYS.requests);
  const req: Request = {
    id: genId('REQ'),
    createdAt: new Date().toISOString(),
    status: partial.status || 'open',
    ...partial
  };
  requests.push(req);
  save(LS_KEYS.requests, requests);
  return req;
}

export function getRequestsByCustomer(customerId: string): Request[] {
  return load<Request>(LS_KEYS.requests).filter(r => r.customerId === customerId);
}

export function updateRequestStatus(requestId: string, status: Request['status']) {
  const requests = load<Request>(LS_KEYS.requests);
  const idx = requests.findIndex(r => r.id === requestId);
  if (idx >= 0) {
    requests[idx].status = status;
    save(LS_KEYS.requests, requests);
  }
}

/**
 * Müşteri tarafından talep iptal edildiğinde çağrılır
 * İlgili tüm teklifleri de 'withdrawn' yapar
 */
export function cancelRequest(requestId: string): boolean {
  const requests = load<Request>(LS_KEYS.requests);
  const idx = requests.findIndex(r => r.id === requestId);
  if (idx < 0) return false;
  
  // Sadece 'open' durumdaki talepler iptal edilebilir
  if (requests[idx].status !== 'open') return false;
  
  requests[idx].status = 'cancelled';
  save(LS_KEYS.requests, requests);
  
  // Bu talebe ait tüm teklifleri geri çek
  const offers = load<Offer>(LS_KEYS.offers);
  offers.forEach(o => {
    if (o.requestId === requestId && o.status === 'sent') {
      o.status = 'withdrawn';
    }
  });
  save(LS_KEYS.offers, offers);
  
  console.log('🔴 [mockApi] Request cancelled:', requestId);
  return true;
}

/**
 * Partner tarafından iş tamamlandığında çağrılır
 * CompletedJob kaydı da oluşturur
 */
export function completeRequestByPartner(requestId: string, offerId: string): boolean {
  const requests = load<Request>(LS_KEYS.requests);
  const idx = requests.findIndex(r => r.id === requestId);
  if (idx < 0) return false;
  
  const request = requests[idx];
  
  // 'matched' veya 'in_progress' durumdaki talepler tamamlanabilir
  if (request.status !== 'matched' && request.status !== 'in_progress') return false;
  
  // Kabul edilmiş teklifi bul
  const offers = load<Offer>(LS_KEYS.offers);
  const acceptedOffer = offers.find(o => o.id === offerId || (o.requestId === requestId && o.status === 'accepted'));
  
  // CompletedJob kaydı oluştur
  if (acceptedOffer && request.assignedPartnerId) {
    const startTime = request.stageUpdatedAt || request.createdAt;
    const completionTime = new Date().toISOString();
    const durationMs = new Date(completionTime).getTime() - new Date(startTime).getTime();
    const durationMinutes = Math.round(durationMs / 60000);
    
    const completedJob: CompletedJob = {
      id: genId('JOB'),
      partnerId: request.assignedPartnerId,
      partnerName: request.assignedPartnerName || 'Partner',
      customerId: request.customerId,
      customerName: request.customerName || 'Müşteri',
      customerPhone: request.customerPhone || '',
      serviceType: request.serviceType,
      startLocation: request.fromLocation,
      endLocation: request.toLocation,
      distance: 0, // Hesaplanamıyor
      startTime: startTime,
      completionTime: completionTime,
      duration: durationMinutes,
      totalAmount: acceptedOffer.price,
      commission: Math.round(acceptedOffer.price * 0.15), // %15 komisyon
      partnerEarning: Math.round(acceptedOffer.price * 0.85),
      paymentMethod: 'nakit',
      vehicleType: 'Çekici',
      vehiclePlate: '34 XX 0000',
      status: 'completed'
    };
    
    const jobs = load<CompletedJob>(LS_KEYS.jobs);
    jobs.push(completedJob);
    save(LS_KEYS.jobs, jobs);
    console.log('📋 [mockApi] CompletedJob created:', completedJob.id);
  }
  
  // Request'i güncelle
  requests[idx].status = 'completed';
  requests[idx].jobStage = 4;
  requests[idx].stageUpdatedAt = new Date().toISOString();
  requests[idx].amount = acceptedOffer?.price;
  save(LS_KEYS.requests, requests);
  
  console.log('✅ [mockApi] Request completed:', requestId);
  return true;
}

/**
 * Tekil request getir (ID ile)
 */
export function getRequestById(requestId: string): Request | null {
  const requests = load<Request>(LS_KEYS.requests);
  return requests.find(r => r.id === requestId) || null;
}

/**
 * Partner işe başladığında çağrılır - Request'i in_progress yapar
 */
export function startJobByPartner(requestId: string, partnerId: string, partnerName: string): { success: boolean; error?: string } {
  const requests = load<Request>(LS_KEYS.requests);
  const idx = requests.findIndex(r => r.id === requestId);
  
  if (idx < 0) {
    return { success: false, error: 'Talep bulunamadı' };
  }
  
  const request = requests[idx];
  
  // Müşteri iptal etmiş mi kontrol et
  if (request.status === 'cancelled') {
    return { success: false, error: 'Müşteri bu talebi iptal etmiş' };
  }
  
  // Sadece 'matched' durumundaki talepler başlatılabilir
  if (request.status !== 'matched') {
    return { success: false, error: `Bu talep başlatılamaz (durum: ${request.status})` };
  }
  
  // Request'i güncelle
  requests[idx] = {
    ...request,
    status: 'in_progress',
    jobStage: 0, // Yola çıkıldı
    assignedPartnerId: partnerId,
    assignedPartnerName: partnerName,
    stageUpdatedAt: new Date().toISOString()
  };
  
  save(LS_KEYS.requests, requests);
  console.log('🚀 [mockApi] Job started by partner:', partnerId, 'for request:', requestId);
  return { success: true };
}

/**
 * İş aşamasını güncelle (0-4)
 * 0: Yola çıkıldı, 1: Varış, 2: Yükleme, 3: Teslimat, 4: Tamamlandı
 */
export function updateJobStage(requestId: string, partnerId: string, newStage: 0 | 1 | 2 | 3 | 4): { success: boolean; error?: string } {
  const requests = load<Request>(LS_KEYS.requests);
  const idx = requests.findIndex(r => r.id === requestId);
  
  if (idx < 0) {
    return { success: false, error: 'Talep bulunamadı' };
  }
  
  const request = requests[idx];
  
  // Müşteri iptal etmiş mi kontrol et
  if (request.status === 'cancelled') {
    return { success: false, error: 'Müşteri bu talebi iptal etmiş' };
  }
  
  // Sadece in_progress durumundaki talepler güncellenebilir
  if (request.status !== 'in_progress') {
    return { success: false, error: `Bu talep güncellenemez (durum: ${request.status})` };
  }
  
  // Partner kontrolü
  if (request.assignedPartnerId !== partnerId) {
    return { success: false, error: 'Bu işi sadece atanan partner güncelleyebilir' };
  }
  
  // Aşama 4 ise işi tamamla
  if (newStage === 4) {
    requests[idx].status = 'completed';
  }
  
  requests[idx].jobStage = newStage;
  requests[idx].stageUpdatedAt = new Date().toISOString();
  
  save(LS_KEYS.requests, requests);
  console.log('📍 [mockApi] Job stage updated:', requestId, 'stage:', newStage);
  return { success: true };
}

// OFFERS
export function createOffer(partnerId: string, requestId: string, data: Omit<Offer,'id'|'createdAt'|'status'|'partnerId'|'requestId'> & { status?: Offer['status'] }): Offer {
  const offers = load<Offer>(LS_KEYS.offers);
  const offer: Offer = {
    id: genId('OFF'),
    createdAt: new Date().toISOString(),
    status: data.status || 'sent',
    partnerId,
    requestId,
    price: data.price,
    etaMinutes: data.etaMinutes,
    message: data.message
  };
  offers.push(offer);
  save(LS_KEYS.offers, offers);
  return offer;
}

export function getOffersForRequest(requestId: string): Offer[] {
  return load<Offer>(LS_KEYS.offers).filter(o => o.requestId === requestId);
}

export function acceptOffer(offerId: string) {
  const offers = load<Offer>(LS_KEYS.offers);
  const offer = offers.find(o => o.id === offerId);
  if (!offer) return;
  offer.status = 'accepted';
  save(LS_KEYS.offers, offers);
  // request status -> matched
  updateRequestStatus(offer.requestId, 'matched');
  // diğer teklifler -> rejected
  offers.filter(o => o.requestId === offer.requestId && o.id !== offerId).forEach(o => o.status = 'rejected');
  save(LS_KEYS.offers, offers);
}

export function rejectOffer(offerId: string) {
  const offers = load<Offer>(LS_KEYS.offers);
  const offer = offers.find(o => o.id === offerId);
  if (!offer) return;
  offer.status = 'rejected';
  save(LS_KEYS.offers, offers);
}

export function withdrawOffer(offerId: string) {
  const offers = load<Offer>(LS_KEYS.offers);
  const offer = offers.find(o => o.id === offerId);
  if (!offer) return;
  offer.status = 'withdrawn';
  save(LS_KEYS.offers, offers);
}

// SEED helper (for development)
export function seedDemoRequests(customerId: string) {
  const existingRequests = getRequestsByCustomer(customerId);
  console.log('🔴 [mockApi] seedDemoRequests called for:', customerId, 'Existing:', existingRequests.length);
  if (existingRequests.length > 0) return; // already seeded
  const req1 = createMockRequest({
    customerId,
    serviceType: 'cekici',
    description: 'Aracım çalışmıyor, çekici gerekiyor',
    fromLocation: 'Kadıköy, İstanbul',
    toLocation: 'Maltepe Servis',
    vehicleInfo: 'Renault Clio 2016'
  });
  console.log('🔴 [mockApi] Created demo request 1:', req1.id);
  const req2 = createMockRequest({
    customerId,
    serviceType: 'aku',
    description: 'Akü tamamen bitti takviye gerekiyor',
    fromLocation: 'Beşiktaş, İstanbul',
    vehicleInfo: 'BMW 3.20 2019'
  });
  console.log('🔴 [mockApi] Created demo request 2:', req2.id);
}

// ============================================
// PARTNER DOCUMENTS (Belgeler)
// ============================================

export function uploadDocument(doc: Omit<PartnerDocument, 'id' | 'uploadDate' | 'status'>): PartnerDocument {
  const docs = load<PartnerDocument>(LS_KEYS.documents);
  const newDoc: PartnerDocument = {
    id: genId('DOC'),
    uploadDate: new Date().toISOString(),
    status: 'pending',
    ...doc
  };
  docs.push(newDoc);
  save(LS_KEYS.documents, docs);
  return newDoc;
}

export function getDocumentsByPartner(partnerId: string): PartnerDocument[] {
  return load<PartnerDocument>(LS_KEYS.documents).filter(d => d.partnerId === partnerId);
}

export function getAllDocuments(): PartnerDocument[] {
  return load<PartnerDocument>(LS_KEYS.documents);
}

export function updateDocumentStatus(docId: string, status: PartnerDocument['status'], rejectionReason?: string): void {
  const docs = load<PartnerDocument>(LS_KEYS.documents);
  const idx = docs.findIndex(d => d.id === docId);
  if (idx >= 0) {
    docs[idx].status = status;
    docs[idx].reviewedAt = new Date().toISOString();
    docs[idx].reviewedBy = 'Admin User';
    if (rejectionReason) docs[idx].rejectionReason = rejectionReason;
    save(LS_KEYS.documents, docs);
  }
}

// ============================================
// REVIEW OBJECTIONS (İtirazlar)
// ============================================

export function submitObjection(objection: Omit<ReviewObjection, 'id' | 'createdAt' | 'status'>): ReviewObjection {
  const objections = load<ReviewObjection>(LS_KEYS.objections);
  const newObj: ReviewObjection = {
    id: genId('OBJ'),
    createdAt: new Date().toISOString(),
    status: 'pending',
    ...objection
  };
  objections.push(newObj);
  save(LS_KEYS.objections, objections);
  
  // Ayrıca review'da objection bilgisini güncelle
  const reviews = load<PartnerReview>(LS_KEYS.reviews);
  const reviewIdx = reviews.findIndex(r => r.id === objection.reviewId);
  if (reviewIdx >= 0) {
    reviews[reviewIdx].objection = {
      id: newObj.id,
      reason: objection.reason,
      status: 'pending',
      createdAt: newObj.createdAt
    };
    save(LS_KEYS.reviews, reviews);
  }
  
  return newObj;
}

export function getObjectionsByPartner(partnerId: string): ReviewObjection[] {
  return load<ReviewObjection>(LS_KEYS.objections).filter(o => o.partnerId === partnerId);
}

export function getAllObjections(): ReviewObjection[] {
  return load<ReviewObjection>(LS_KEYS.objections);
}

export function updateObjectionStatus(objId: string, status: ReviewObjection['status'], adminNotes?: string): void {
  const objections = load<ReviewObjection>(LS_KEYS.objections);
  const idx = objections.findIndex(o => o.id === objId);
  if (idx >= 0) {
    objections[idx].status = status;
    objections[idx].resolvedAt = new Date().toISOString();
    objections[idx].resolvedBy = 'Admin';
    if (adminNotes) objections[idx].adminNotes = adminNotes;
    save(LS_KEYS.objections, objections);
    
    // Review'daki objection'ı da güncelle
    const reviews = load<PartnerReview>(LS_KEYS.reviews);
    const reviewIdx = reviews.findIndex(r => r.id === objections[idx].reviewId);
    if (reviewIdx >= 0 && reviews[reviewIdx].objection) {
      reviews[reviewIdx].objection!.status = status;
      save(LS_KEYS.reviews, reviews);
    }
  }
}

// ============================================
// SUPPORT TICKETS (Destek Talepleri)
// ============================================

export function createSupportTicket(ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'status'>): SupportTicket {
  const tickets = load<SupportTicket>(LS_KEYS.tickets);
  const newTicket: SupportTicket = {
    id: genId('TKT'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'open',
    ...ticket
  };
  tickets.push(newTicket);
  save(LS_KEYS.tickets, tickets);
  return newTicket;
}

export function getTicketsByPartner(partnerId: string): SupportTicket[] {
  return load<SupportTicket>(LS_KEYS.tickets).filter(t => t.partnerId === partnerId);
}

export function getAllTickets(): SupportTicket[] {
  return load<SupportTicket>(LS_KEYS.tickets);
}

export function updateTicketStatus(ticketId: string, status: SupportTicket['status'], resolution?: string, assignedTo?: string): void {
  const tickets = load<SupportTicket>(LS_KEYS.tickets);
  const idx = tickets.findIndex(t => t.id === ticketId);
  if (idx >= 0) {
    tickets[idx].status = status;
    tickets[idx].updatedAt = new Date().toISOString();
    if (resolution) tickets[idx].resolution = resolution;
    if (assignedTo) tickets[idx].assignedTo = assignedTo;
    save(LS_KEYS.tickets, tickets);
  }
}

// ============================================
// PARTNER VEHICLES (Filo Yönetimi)
// ============================================

export function addVehicle(vehicle: Omit<PartnerVehicle, 'id' | 'registrationDate' | 'totalJobs' | 'totalEarnings'>): PartnerVehicle {
  const vehicles = load<PartnerVehicle>(LS_KEYS.vehicles);
  const newVehicle: PartnerVehicle = {
    id: genId('VEH'),
    registrationDate: new Date().toISOString().split('T')[0],
    totalJobs: 0,
    totalEarnings: 0,
    ...vehicle
  };
  vehicles.push(newVehicle);
  save(LS_KEYS.vehicles, vehicles);
  return newVehicle;
}

export function getVehiclesByPartner(partnerId: string): PartnerVehicle[] {
  return load<PartnerVehicle>(LS_KEYS.vehicles).filter(v => v.partnerId === partnerId);
}

export function getAllVehicles(): PartnerVehicle[] {
  return load<PartnerVehicle>(LS_KEYS.vehicles);
}

export function updateVehicle(vehicleId: string, updates: Partial<PartnerVehicle>): void {
  const vehicles = load<PartnerVehicle>(LS_KEYS.vehicles);
  const idx = vehicles.findIndex(v => v.id === vehicleId);
  if (idx >= 0) {
    vehicles[idx] = { ...vehicles[idx], ...updates };
    save(LS_KEYS.vehicles, vehicles);
  }
}

export function deleteVehicle(vehicleId: string): void {
  const vehicles = load<PartnerVehicle>(LS_KEYS.vehicles);
  save(LS_KEYS.vehicles, vehicles.filter(v => v.id !== vehicleId));
}

// ============================================
// CREDITS (Kredi Sistemi)
// ============================================

export function getPartnerCredits(partnerId: string): PartnerCredit | null {
  const credits = load<PartnerCredit>(LS_KEYS.credits);
  return credits.find(c => c.partnerId === partnerId) || null;
}

export function getAllPartnerCredits(): PartnerCredit[] {
  return load<PartnerCredit>(LS_KEYS.credits);
}

export function purchaseCredits(partnerId: string, partnerName: string, amount: number, description: string): CreditTransaction {
  const credits = load<PartnerCredit>(LS_KEYS.credits);
  const transactions = load<CreditTransaction>(LS_KEYS.creditTransactions);
  
  let partnerCredit = credits.find(c => c.partnerId === partnerId);
  const balanceBefore = partnerCredit?.balance || 0;
  
  if (!partnerCredit) {
    partnerCredit = {
      partnerId,
      partnerName,
      balance: 0,
      totalPurchased: 0,
      totalUsed: 0,
      lastTransaction: new Date().toISOString()
    };
    credits.push(partnerCredit);
  }
  
  partnerCredit.balance += amount;
  partnerCredit.totalPurchased += amount;
  partnerCredit.lastTransaction = new Date().toISOString();
  
  const transaction: CreditTransaction = {
    id: genId('CTX'),
    partnerId,
    partnerName,
    type: 'purchase',
    amount,
    balanceBefore,
    balanceAfter: partnerCredit.balance,
    description,
    date: new Date().toISOString()
  };
  
  transactions.push(transaction);
  save(LS_KEYS.credits, credits);
  save(LS_KEYS.creditTransactions, transactions);
  
  return transaction;
}

export function useCredits(partnerId: string, partnerName: string, amount: number, requestId: string, description: string): CreditTransaction | null {
  const credits = load<PartnerCredit>(LS_KEYS.credits);
  const transactions = load<CreditTransaction>(LS_KEYS.creditTransactions);
  
  const partnerCredit = credits.find(c => c.partnerId === partnerId);
  if (!partnerCredit || partnerCredit.balance < amount) return null;
  
  const balanceBefore = partnerCredit.balance;
  partnerCredit.balance -= amount;
  partnerCredit.totalUsed += amount;
  partnerCredit.lastTransaction = new Date().toISOString();
  
  const transaction: CreditTransaction = {
    id: genId('CTX'),
    partnerId,
    partnerName,
    type: 'usage',
    amount: -amount,
    balanceBefore,
    balanceAfter: partnerCredit.balance,
    description,
    date: new Date().toISOString(),
    requestId
  };
  
  transactions.push(transaction);
  save(LS_KEYS.credits, credits);
  save(LS_KEYS.creditTransactions, transactions);
  
  return transaction;
}

export function getCreditTransactions(partnerId: string): CreditTransaction[] {
  return load<CreditTransaction>(LS_KEYS.creditTransactions).filter(t => t.partnerId === partnerId);
}

export function getAllCreditTransactions(): CreditTransaction[] {
  return load<CreditTransaction>(LS_KEYS.creditTransactions);
}

// ============================================
// EMPTY TRUCK ROUTES (Boş Kamyon Rotaları)
// ============================================

export function createRoute(route: Omit<EmptyTruckRoute, 'id' | 'createdAt' | 'status'>): EmptyTruckRoute {
  const routes = load<EmptyTruckRoute>(LS_KEYS.routes);
  const newRoute: EmptyTruckRoute = {
    id: genId('RTE'),
    createdAt: new Date().toISOString(),
    status: 'active',
    ...route
  };
  routes.push(newRoute);
  save(LS_KEYS.routes, routes);
  return newRoute;
}

export function getRoutesByPartner(partnerId: string): EmptyTruckRoute[] {
  return load<EmptyTruckRoute>(LS_KEYS.routes).filter(r => r.partnerId === partnerId);
}

export function getAllRoutes(): EmptyTruckRoute[] {
  return load<EmptyTruckRoute>(LS_KEYS.routes);
}

export function updateRouteStatus(routeId: string, status: EmptyTruckRoute['status']): void {
  const routes = load<EmptyTruckRoute>(LS_KEYS.routes);
  const idx = routes.findIndex(r => r.id === routeId);
  if (idx >= 0) {
    routes[idx].status = status;
    save(LS_KEYS.routes, routes);
  }
}

export function deleteRoute(routeId: string): void {
  const routes = load<EmptyTruckRoute>(LS_KEYS.routes);
  save(LS_KEYS.routes, routes.filter(r => r.id !== routeId));
}

// ============================================
// REVIEWS (Değerlendirmeler)
// ============================================

export function getReviewsByPartner(partnerId: string): PartnerReview[] {
  return load<PartnerReview>(LS_KEYS.reviews).filter(r => r.partnerId === partnerId);
}

export function getAllReviews(): PartnerReview[] {
  return load<PartnerReview>(LS_KEYS.reviews);
}

export function createReview(review: Omit<PartnerReview, 'id' | 'date'>): PartnerReview {
  const reviews = load<PartnerReview>(LS_KEYS.reviews);
  const newReview: PartnerReview = {
    id: genId('REV'),
    date: new Date().toISOString(),
    ...review
  };
  reviews.push(newReview);
  save(LS_KEYS.reviews, reviews);
  return newReview;
}

// ============================================
// COMPLETED JOBS (Tamamlanan İşler)
// ============================================

export function getJobsByPartner(partnerId: string): CompletedJob[] {
  return load<CompletedJob>(LS_KEYS.jobs).filter(j => j.partnerId === partnerId);
}

export function getAllJobs(): CompletedJob[] {
  return load<CompletedJob>(LS_KEYS.jobs);
}

export function createJob(job: Omit<CompletedJob, 'id'>): CompletedJob {
  const jobs = load<CompletedJob>(LS_KEYS.jobs);
  const newJob: CompletedJob = {
    id: genId('JOB'),
    ...job
  };
  jobs.push(newJob);
  save(LS_KEYS.jobs, jobs);
  return newJob;
}

export function getAllRequests(): Request[] {
  return load<Request>(LS_KEYS.requests);
}

export function getAllOffers(): Offer[] {
  return load<Offer>(LS_KEYS.offers);
}

// ============================================
// ADMIN SPECIFIC FUNCTIONS
// ============================================

/**
 * Request verilerini Admin'in beklediği CustomerRequestLog formatına dönüştürür
 * Bu fonksiyon B2C tarafından oluşturulan talepleri Admin panelinde göstermek için kullanılır
 */
export function getCustomerRequestsForAdmin(): CustomerRequestLog[] {
  const requests = load<Request>(LS_KEYS.requests);
  const jobs = load<CompletedJob>(LS_KEYS.jobs);
  
  return requests.map(req => {
    // Tamamlanan iş varsa amount'u al
    const completedJob = jobs.find(j => j.customerId === req.customerId && j.serviceType.toLowerCase().includes(req.serviceType));
    
    // Müşteri adını çıkar (customerId'den veya description'dan)
    let customerName = 'Misafir Müşteri';
    
    // localStorage'dan customer bilgisi çekmeye çalış
    try {
      const customerData = localStorage.getItem('yolmov_customer');
      if (customerData) {
        const customer = JSON.parse(customerData);
        if (customer.id === req.customerId) {
          customerName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Misafir Müşteri';
        }
      }
    } catch (e) {
      // ignore parse errors
    }
    
    // customerId prefix'inden isim tahmin et
    if (req.customerId.startsWith('USR-')) {
      const userNames: Record<string, string> = {
        'USR-001': 'Ahmet Yılmaz',
        'USR-002': 'Mehmet Kaya',
        'USR-003': 'Selin Kaya',
        'USR-004': 'Burak Yıldırım',
        'USR-005': 'Zeynep Aydın',
      };
      customerName = userNames[req.customerId] || customerName;
    }
    
    return {
      id: req.id,
      customerId: req.customerId,
      customerName: req.customerName || customerName,
      serviceType: req.serviceType,
      location: req.fromLocation,
      status: req.status,
      createdAt: formatDateForAdmin(req.createdAt),
      amount: completedJob?.totalAmount || req.amount,
      description: req.description,
      vehicleInfo: req.vehicleInfo,
      toLocation: req.toLocation
    };
  });
}

/**
 * Partner için açık talepleri listeler (iş fırsatları)
 */
export function getOpenRequestsForPartner(): Request[] {
  const requests = load<Request>(LS_KEYS.requests);
  return requests.filter(r => r.status === 'open');
}

/**
 * Tarih formatını Admin paneli için uygun hale getirir
 */
function formatDateForAdmin(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  } catch {
    return isoDate;
  }
}

// ============================================
// SEED DATA - Zengin Test Verileri
// ============================================

export function initializeMockData(): void {
  if (localStorage.getItem(LS_KEYS.initialized)) return;
  
  // Users
  const users: User[] = [
    { id: 'USR-001', name: 'Ahmet Yılmaz', email: 'ahmet@example.com', type: 'customer', status: 'active', joinDate: '2023-10-15', totalSpent: 2400 },
    { id: 'USR-002', name: 'Selin Kaya', email: 'selin@example.com', type: 'customer', status: 'active', joinDate: '2023-11-01', totalSpent: 800 },
    { id: 'PTR-001', name: 'Yılmaz Oto Kurtarma', email: 'yilmaz@partner.com', type: 'partner', status: 'active', joinDate: '2023-09-10', totalEarned: 15600 },
    { id: 'PTR-002', name: 'Hızlı Yol Yardım', email: 'hizli@partner.com', type: 'partner', status: 'active', joinDate: '2023-08-20', totalEarned: 28900 },
  ];
  save(LS_KEYS.users, users);

  // Partners
  const partners: Partner[] = [
    { id: 'PTR-001', name: 'Yılmaz Oto Kurtarma', email: 'yilmaz@partner.com', phone: '0532 XXX XX 01', rating: 4.9, completedJobs: 128, credits: 25, status: 'active' },
    { id: 'PTR-002', name: 'Hızlı Yol Yardım', email: 'hizli@partner.com', phone: '0533 XXX XX 02', rating: 4.7, completedJobs: 203, credits: 50, status: 'active' },
    { id: 'PTR-003', name: 'Mega Çekici', email: 'mega@partner.com', phone: '0534 XXX XX 03', rating: 4.5, completedJobs: 89, credits: 10, status: 'pending' },
  ];
  save(LS_KEYS.partners, partners);

  // Lead Requests
  const leadRequests: PartnerLeadRequest[] = [
    {
      id: 'LREQ-001',
      partnerId: 'PTR-001',
      partnerName: 'Yılmaz Oto Kurtarma',
      requestType: 'lead_purchase',
      serviceArea: 'Kadıköy, İstanbul',
      serviceType: 'cekici',
      creditCost: 1,
      status: 'approved',
      createdAt: '2024-11-26 14:30',
      resolvedAt: '2024-11-26 15:00',
      resolvedBy: 'Admin User',
      adminNotes: 'Onaylandı, 1 kredi düşüldü',
      customerInfo: {
        name: 'Mehmet Demir',
        phone: '0532 111 22 33',
        location: 'Kadıköy Moda Caddesi, İstanbul'
      }
    },
    {
      id: 'LREQ-002',
      partnerId: 'PTR-002',
      partnerName: 'Hızlı Yol Yardım',
      requestType: 'lead_purchase',
      serviceArea: 'Beşiktaş, İstanbul',
      serviceType: 'aku',
      creditCost: 1,
      status: 'pending',
      createdAt: '2024-11-27 09:15',
    }
  ];
  save(LS_KEYS.leadRequests, leadRequests);

  // Area Requests
  const areaRequests: ServiceAreaRequest[] = [
    {
      id: 'AREQ-001',
      partnerId: 'PTR-002',
      partnerName: 'Hızlı Yol Yardım',
      requestType: 'area_expansion',
      currentAreas: ['Çankaya, Ankara', 'Keçiören, Ankara'],
      requestedAreas: ['Mamak, Ankara', 'Etimesgut, Ankara'],
      reason: 'Filomuz bu bölgelere yeterli. 2 yeni araç ekledik.',
      status: 'pending',
      createdAt: '2024-11-26 11:00',
    }
  ];
  save(LS_KEYS.areaRequests, areaRequests);

  // Partner Credits
  const credits: PartnerCredit[] = [
    { partnerId: 'PTR-001', partnerName: 'Yılmaz Oto Kurtarma', balance: 25, totalPurchased: 100, totalUsed: 75, lastTransaction: '2024-11-22T15:30:00Z' },
    { partnerId: 'PTR-002', partnerName: 'Hızlı Yol Yardım', balance: 50, totalPurchased: 200, totalUsed: 150, lastTransaction: '2024-11-15T14:00:00Z' },
    { partnerId: 'PTR-003', partnerName: 'Mega Çekici', balance: 10, totalPurchased: 50, totalUsed: 40, lastTransaction: '2024-11-10T16:45:00Z' },
    { partnerId: 'PTR-004', partnerName: 'Anadolu Yol Yardım', balance: 35, totalPurchased: 80, totalUsed: 45, lastTransaction: '2024-11-20T10:00:00Z' },
    { partnerId: 'PTR-005', partnerName: 'İstanbul Çekici', balance: 75, totalPurchased: 150, totalUsed: 75, lastTransaction: '2024-11-18T12:30:00Z' },
  ];
  save(LS_KEYS.credits, credits);
  
  // Credit Transactions
  const creditTransactions: CreditTransaction[] = [
    { id: 'CTX-001', partnerId: 'PTR-001', partnerName: 'Yılmaz Oto Kurtarma', type: 'usage', amount: -1, balanceBefore: 26, balanceAfter: 25, description: 'Müşteri iletişim talebi - Çekici Hizmeti', date: '2024-11-22T15:30:00Z', requestId: 'REQ-4923' },
    { id: 'CTX-002', partnerId: 'PTR-001', partnerName: 'Yılmaz Oto Kurtarma', type: 'purchase', amount: 50, balanceBefore: 26, balanceAfter: 76, description: 'Kredi paketi satın alındı - 50 Kredi', date: '2024-11-20T10:00:00Z' },
    { id: 'CTX-003', partnerId: 'PTR-002', partnerName: 'Hızlı Yol Yardım', type: 'usage', amount: -1, balanceBefore: 51, balanceAfter: 50, description: 'Müşteri iletişim talebi - Akü Takviyesi', date: '2024-11-19T10:15:00Z', requestId: 'REQ-4920' },
    { id: 'CTX-004', partnerId: 'PTR-002', partnerName: 'Hızlı Yol Yardım', type: 'purchase', amount: 100, balanceBefore: 0, balanceAfter: 100, description: 'Kredi paketi satın alındı - 100 Kredi', date: '2024-11-15T14:00:00Z' },
    { id: 'CTX-005', partnerId: 'PTR-003', partnerName: 'Mega Çekici', type: 'adjustment', amount: 10, balanceBefore: 0, balanceAfter: 10, description: 'Manuel kredi ekleme - Promosyon', date: '2024-11-10T16:45:00Z', adminUser: 'Admin User' },
    { id: 'CTX-006', partnerId: 'PTR-004', partnerName: 'Anadolu Yol Yardım', type: 'purchase', amount: 30, balanceBefore: 5, balanceAfter: 35, description: 'Kredi paketi satın alındı - 30 Kredi', date: '2024-11-20T10:00:00Z' },
    { id: 'CTX-007', partnerId: 'PTR-005', partnerName: 'İstanbul Çekici', type: 'purchase', amount: 75, balanceBefore: 0, balanceAfter: 75, description: 'Kredi paketi satın alındı - 75 Kredi', date: '2024-11-18T12:30:00Z' },
  ];
  save(LS_KEYS.creditTransactions, creditTransactions);
  
  // Vehicles
  const vehicles: PartnerVehicle[] = [
    { id: 'VEH-001', partnerId: 'PTR-001', partnerName: 'Yılmaz Oto Kurtarma', plate: '34 AB 1234', model: '2020 Ford F-Max', type: 'Kayar Kasa', driver: 'Mehmet Yıldız', status: 'active', registrationDate: '2023-09-10', lastService: '2024-10-15', totalJobs: 128, totalEarnings: 45600 },
    { id: 'VEH-002', partnerId: 'PTR-001', partnerName: 'Yılmaz Oto Kurtarma', plate: '34 CD 5678', model: '2019 Mercedes Atego', type: 'Platform', driver: 'Ali Kaya', status: 'active', registrationDate: '2023-09-10', lastService: '2024-11-05', totalJobs: 95, totalEarnings: 32400 },
    { id: 'VEH-003', partnerId: 'PTR-002', partnerName: 'Hızlı Yol Yardım', plate: '34 XY 9988', model: '2018 Isuzu NPR', type: 'Ahtapot Vinç', driver: 'Ahmet Demir', status: 'maintenance', registrationDate: '2023-08-20', lastService: '2024-11-20', totalJobs: 203, totalEarnings: 78900 },
    { id: 'VEH-004', partnerId: 'PTR-002', partnerName: 'Hızlı Yol Yardım', plate: '06 ZZ 4321', model: '2021 Iveco Daily', type: 'Çekici', driver: 'Selin Yılmaz', status: 'active', registrationDate: '2023-08-20', lastService: '2024-09-12', totalJobs: 167, totalEarnings: 56700 },
    { id: 'VEH-005', partnerId: 'PTR-003', partnerName: 'Mega Çekici', plate: '35 TT 7890', model: '2017 MAN TGX', type: 'Ağır Çekici', driver: 'Burak Özkan', status: 'disabled', registrationDate: '2024-02-15', lastService: '2024-08-20', totalJobs: 45, totalEarnings: 18900 },
    { id: 'VEH-006', partnerId: 'PTR-003', partnerName: 'Mega Çekici', plate: '35 MM 1122', model: '2022 Renault Trucks D', type: 'Platform', driver: 'Zeynep Aydın', status: 'active', registrationDate: '2024-02-15', lastService: '2024-11-10', totalJobs: 44, totalEarnings: 16200 },
    { id: 'VEH-007', partnerId: 'PTR-004', partnerName: 'Anadolu Yol Yardım', plate: '06 AA 3344', model: '2019 Ford Transit', type: 'Yardım Aracı', driver: 'Can Yılmaz', status: 'active', registrationDate: '2023-06-01', lastService: '2024-10-01', totalJobs: 89, totalEarnings: 28500 },
    { id: 'VEH-008', partnerId: 'PTR-005', partnerName: 'İstanbul Çekici', plate: '34 FF 9900', model: '2021 Volvo FH', type: 'Ağır Çekici', driver: 'Emre Akın', status: 'active', registrationDate: '2024-01-10', lastService: '2024-11-15', totalJobs: 156, totalEarnings: 68400 },
  ];
  save(LS_KEYS.vehicles, vehicles);
  
  // Documents
  const documents: PartnerDocument[] = [
    { id: 'DOC-001', partnerId: 'PTR-001', partnerName: 'Yılmaz Oto Kurtarma', type: 'license', fileName: 'isletme_ruhsati.pdf', fileSize: '2.4 MB', status: 'approved', uploadDate: '2024-09-15T10:00:00Z', expiryDate: '2025-09-15' },
    { id: 'DOC-002', partnerId: 'PTR-001', partnerName: 'Yılmaz Oto Kurtarma', type: 'insurance', fileName: 'kasko_police.pdf', fileSize: '1.8 MB', status: 'approved', uploadDate: '2024-10-20T14:30:00Z', expiryDate: '2025-10-20' },
    { id: 'DOC-003', partnerId: 'PTR-002', partnerName: 'Hızlı Yol Yardım', type: 'registration', fileName: 'arac_tescil.pdf', fileSize: '3.1 MB', status: 'pending', uploadDate: '2024-11-22T09:00:00Z' },
    { id: 'DOC-004', partnerId: 'PTR-002', partnerName: 'Hızlı Yol Yardım', type: 'tax', fileName: 'vergi_levhasi.pdf', fileSize: '1.2 MB', status: 'approved', uploadDate: '2024-08-10T11:00:00Z' },
    { id: 'DOC-005', partnerId: 'PTR-003', partnerName: 'Mega Çekici', type: 'identity', fileName: 'kimlik_fotokopi.jpg', fileSize: '850 KB', status: 'rejected', uploadDate: '2024-11-18T16:00:00Z', rejectionReason: 'Fotoğraf kalitesi yetersiz, lütfen tekrar yükleyin.' },
    { id: 'DOC-006', partnerId: 'PTR-003', partnerName: 'Mega Çekici', type: 'license', fileName: 'isletme_belgesi.pdf', fileSize: '2.0 MB', status: 'pending', uploadDate: '2024-11-25T08:30:00Z' },
    { id: 'DOC-007', partnerId: 'PTR-004', partnerName: 'Anadolu Yol Yardım', type: 'insurance', fileName: 'trafik_sigortasi.pdf', fileSize: '1.5 MB', status: 'approved', uploadDate: '2024-09-01T13:00:00Z', expiryDate: '2025-09-01' },
    { id: 'DOC-008', partnerId: 'PTR-005', partnerName: 'İstanbul Çekici', type: 'license', fileName: 'ruhsat_2024.pdf', fileSize: '2.8 MB', status: 'pending', uploadDate: '2024-11-27T09:15:00Z' },
  ];
  save(LS_KEYS.documents, documents);
  
  // Reviews
  const reviews: PartnerReview[] = [
    { id: 'REV-001', jobId: 'JOB-4923', partnerId: 'PTR-001', partnerName: 'Yılmaz Oto Kurtarma', customerId: 'USR-001', customerName: 'Ahmet Yılmaz', service: 'Çekici Hizmeti', rating: 5, comment: 'Çok hızlı geldi, işini profesyonelce yaptı. Teşekkürler!', tags: ['Hızlı', 'Profesyonel'], date: '2024-11-22T16:00:00Z' },
    { id: 'REV-002', jobId: 'JOB-4920', partnerId: 'PTR-001', partnerName: 'Yılmaz Oto Kurtarma', customerId: 'USR-002', customerName: 'Mehmet Kaya', service: 'Akü Takviyesi', rating: 2, comment: 'Geç geldi ve çok pahalıydı.', tags: ['Geç Geldi'], date: '2024-11-19T11:30:00Z', objection: { id: 'OBJ-001', reason: 'Trafik yoğunluğu nedeniyle geciktik, müşteriye bilgi verdik.', status: 'pending', createdAt: '2024-11-20T09:00:00Z' } },
    { id: 'REV-003', jobId: 'JOB-4918', partnerId: 'PTR-002', partnerName: 'Hızlı Yol Yardım', customerId: 'USR-003', customerName: 'Selin Kaya', service: 'Çekici Hizmeti', rating: 4, comment: 'İyi hizmet, sadece biraz beklettiler.', tags: ['İyi Hizmet'], date: '2024-11-15T14:45:00Z' },
    { id: 'REV-004', jobId: 'JOB-4915', partnerId: 'PTR-002', partnerName: 'Hızlı Yol Yardım', customerId: 'USR-004', customerName: 'Burak Yıldırım', service: 'Çekici Hizmeti', rating: 1, comment: 'Aracıma zarar verildi, kabul edilemez!', tags: ['Araç Hasarı', 'Kötü Deneyim'], date: '2024-11-12T10:00:00Z', objection: { id: 'OBJ-002', reason: 'Araçta önceden mevcut hasar vardı, fotoğraf kanıtlarımız mevcut.', status: 'approved', createdAt: '2024-11-13T08:00:00Z' } },
    { id: 'REV-005', jobId: 'JOB-4912', partnerId: 'PTR-003', partnerName: 'Mega Çekici', customerId: 'USR-005', customerName: 'Zeynep Aydın', service: 'Lastik Değişimi', rating: 5, comment: 'Süper hizmet, 15 dakikada geldi!', tags: ['Hızlı', 'Profesyonel', 'Güler Yüzlü'], date: '2024-11-10T17:00:00Z' },
    { id: 'REV-006', jobId: 'JOB-4910', partnerId: 'PTR-003', partnerName: 'Mega Çekici', customerId: 'USR-006', customerName: 'Caner Erkin', service: 'Yakıt Desteği', rating: 5, comment: 'Gece yarısı aradım, 20 dakikada geldiler. Harika!', tags: ['7/24 Hizmet', 'Hızlı'], date: '2024-11-08T02:30:00Z' },
    { id: 'REV-007', jobId: 'JOB-4908', partnerId: 'PTR-001', partnerName: 'Yılmaz Oto Kurtarma', customerId: 'USR-007', customerName: 'Elif Demir', service: 'Çekici Hizmeti', rating: 3, comment: 'Ortalama bir hizmet, fiyat biraz yüksekti.', tags: ['Ortalama'], date: '2024-11-05T09:30:00Z' },
    { id: 'REV-008', jobId: 'JOB-4905', partnerId: 'PTR-002', partnerName: 'Hızlı Yol Yardım', customerId: 'USR-008', customerName: 'Ayşe Kara', service: 'Akü Takviyesi', rating: 5, comment: 'Çok nazik ve yardımsever ekip.', tags: ['Güler Yüzlü', 'Profesyonel'], date: '2024-11-03T14:45:00Z' },
    { id: 'REV-009', jobId: 'JOB-4902', partnerId: 'PTR-004', partnerName: 'Anadolu Yol Yardım', customerId: 'USR-009', customerName: 'Murat Şahin', service: 'Yol Yardım', rating: 4, comment: 'İşini bilen ekip, teşekkürler.', tags: ['Profesyonel'], date: '2024-11-01T18:00:00Z' },
    { id: 'REV-010', jobId: 'JOB-4899', partnerId: 'PTR-005', partnerName: 'İstanbul Çekici', customerId: 'USR-010', customerName: 'Deniz Yılmaz', service: 'Ağır Vasıta Çekici', rating: 5, comment: 'Kamyonumu güvenle taşıdılar, profesyonel iş.', tags: ['Profesyonel', 'Güvenilir'], date: '2024-10-28T11:00:00Z' },
  ];
  save(LS_KEYS.reviews, reviews);
  
  // Objections (Reviews'daki objection bilgileri)
  const objections: ReviewObjection[] = [
    { id: 'OBJ-001', reviewId: 'REV-002', partnerId: 'PTR-001', partnerName: 'Yılmaz Oto Kurtarma', reason: 'Trafik yoğunluğu nedeniyle geciktik, müşteriye bilgi verdik.', status: 'pending', createdAt: '2024-11-20T09:00:00Z' },
    { id: 'OBJ-002', reviewId: 'REV-004', partnerId: 'PTR-002', partnerName: 'Hızlı Yol Yardım', reason: 'Araçta önceden mevcut hasar vardı, fotoğraf kanıtlarımız mevcut.', status: 'approved', createdAt: '2024-11-13T08:00:00Z', resolvedAt: '2024-11-14T10:00:00Z', resolvedBy: 'Admin', adminNotes: 'Fotoğraf kanıtları incelendi, itiraz onaylandı.' },
  ];
  save(LS_KEYS.objections, objections);
  
  // Support Tickets
  const tickets: SupportTicket[] = [
    { id: 'TKT-001', partnerId: 'PTR-003', partnerName: 'Mega Çekici', category: 'billing', priority: 'high', subject: 'Ödeme sistemi sorunu', description: 'Son 3 gündür ödeme çekme işlemi gerçekleştiremiyorum. Bakiye görünüyor ama çekim yapamıyorum.', status: 'in_progress', createdAt: '2024-11-27T08:30:00Z', updatedAt: '2024-11-27T09:00:00Z', assignedTo: 'Finans Ekibi' },
    { id: 'TKT-002', partnerId: 'PTR-001', partnerName: 'Yılmaz Oto Kurtarma', category: 'technical', priority: 'medium', subject: 'Mobil uygulama GPS sorunu', description: 'Mobil uygulamada konum paylaşımı zaman zaman kopuyor.', status: 'resolved', createdAt: '2024-11-25T14:15:00Z', updatedAt: '2024-11-26T10:00:00Z', assignedTo: 'Teknik Destek', resolution: 'GPS izinleri yeniden ayarlandı. Uygulama güncellemesi yayınlandı.' },
    { id: 'TKT-003', partnerId: 'PTR-002', partnerName: 'Hızlı Yol Yardım', category: 'feature', priority: 'low', subject: 'Toplu SMS gönderme özelliği', description: 'Müşterilere kampanya duyurusu için toplu SMS gönderebilir miyiz?', status: 'open', createdAt: '2024-11-26T16:00:00Z', updatedAt: '2024-11-26T16:00:00Z' },
    { id: 'TKT-004', partnerId: 'PTR-001', partnerName: 'Yılmaz Oto Kurtarma', category: 'account', priority: 'urgent', subject: 'Hesap askıya alındı', description: 'Hesabım neden askıya alındı? Acil çözüm gerekiyor, işlerimiz durdu.', status: 'resolved', createdAt: '2024-11-24T10:00:00Z', updatedAt: '2024-11-24T12:30:00Z', assignedTo: 'Admin', resolution: 'Doğrulama eksikliği. Belgeler tamamlandı, hesap aktif edildi.' },
    { id: 'TKT-005', partnerId: 'PTR-004', partnerName: 'Anadolu Yol Yardım', category: 'general', priority: 'medium', subject: 'Hizmet alanı genişletme', description: 'Ankara dışında Eskişehir bölgesine de hizmet vermek istiyoruz.', status: 'open', createdAt: '2024-11-26T11:00:00Z', updatedAt: '2024-11-26T11:00:00Z' },
    { id: 'TKT-006', partnerId: 'PTR-005', partnerName: 'İstanbul Çekici', category: 'billing', priority: 'medium', subject: 'Fatura sorunu', description: 'Geçen ayın faturası hatalı gözüküyor, kontrol edilebilir mi?', status: 'in_progress', createdAt: '2024-11-25T09:00:00Z', updatedAt: '2024-11-26T14:00:00Z', assignedTo: 'Finans Ekibi' },
  ];
  save(LS_KEYS.tickets, tickets);
  
  // Empty Truck Routes
  const routes: EmptyTruckRoute[] = [
    { id: 'RTE-001', partnerId: 'PTR-001', partnerName: 'Yılmaz Oto Kurtarma', fromCity: 'İstanbul', toCity: 'Ankara', departureDate: '2024-11-28', vehicleType: 'Kayar Kasa', vehiclePlate: '34 AB 1234', availableCapacity: 'Tam kapasite', pricePerKm: 8.5, notes: 'Gece seferi yapılabilir', status: 'active', createdAt: '2024-11-26T10:00:00Z' },
    { id: 'RTE-002', partnerId: 'PTR-002', partnerName: 'Hızlı Yol Yardım', fromCity: 'İstanbul', toCity: 'İzmir', departureDate: '2024-11-29', vehicleType: 'Platform', vehiclePlate: '06 ZZ 4321', availableCapacity: 'Yarım kapasite', pricePerKm: 7.0, status: 'active', createdAt: '2024-11-25T14:00:00Z' },
    { id: 'RTE-003', partnerId: 'PTR-003', partnerName: 'Mega Çekici', fromCity: 'İzmir', toCity: 'Antalya', departureDate: '2024-11-30', vehicleType: 'Ağır Çekici', vehiclePlate: '35 MM 1122', availableCapacity: 'Tam kapasite', pricePerKm: 12.0, notes: 'Sadece ağır vasıta', status: 'active', createdAt: '2024-11-24T09:00:00Z' },
    { id: 'RTE-004', partnerId: 'PTR-004', partnerName: 'Anadolu Yol Yardım', fromCity: 'Ankara', toCity: 'İstanbul', departureDate: '2024-11-27', vehicleType: 'Yardım Aracı', vehiclePlate: '06 AA 3344', availableCapacity: 'Tam kapasite', status: 'completed', createdAt: '2024-11-20T08:00:00Z' },
    { id: 'RTE-005', partnerId: 'PTR-005', partnerName: 'İstanbul Çekici', fromCity: 'İstanbul', toCity: 'Bursa', departureDate: '2024-11-28', vehicleType: 'Ağır Çekici', vehiclePlate: '34 FF 9900', availableCapacity: 'Tam kapasite', pricePerKm: 10.0, status: 'active', createdAt: '2024-11-26T16:00:00Z' },
  ];
  save(LS_KEYS.routes, routes);
  
  // Completed Jobs
  const jobs: CompletedJob[] = [
    { id: 'JOB-4923', partnerId: 'PTR-001', partnerName: 'Yılmaz Oto Kurtarma', customerId: 'USR-001', customerName: 'Ahmet Yılmaz', customerPhone: '0532 111 22 33', serviceType: 'Çekici Hizmeti', startLocation: 'Kadıköy, İstanbul', endLocation: 'Kartal, İstanbul', distance: 18, startTime: '2024-11-22T15:00:00Z', completionTime: '2024-11-22T15:45:00Z', duration: 45, totalAmount: 2500, commission: 375, partnerEarning: 2125, paymentMethod: 'kredi_karti', rating: 5, vehicleType: 'Çekici - Ağır Hizmet', vehiclePlate: '34 AB 1234', status: 'completed' },
    { id: 'JOB-4920', partnerId: 'PTR-001', partnerName: 'Yılmaz Oto Kurtarma', customerId: 'USR-002', customerName: 'Mehmet Kaya', customerPhone: '0533 222 33 44', serviceType: 'Akü Takviyesi', startLocation: 'Beşiktaş, İstanbul', startTime: '2024-11-19T10:00:00Z', completionTime: '2024-11-19T10:30:00Z', duration: 30, totalAmount: 800, commission: 120, partnerEarning: 680, paymentMethod: 'nakit', rating: 2, vehicleType: 'Hafif Yardım Aracı', vehiclePlate: '34 CD 5678', status: 'completed' },
    { id: 'JOB-4918', partnerId: 'PTR-002', partnerName: 'Hızlı Yol Yardım', customerId: 'USR-003', customerName: 'Selin Kaya', customerPhone: '0534 333 44 55', serviceType: 'Çekici Hizmeti', startLocation: 'Maltepe, İstanbul', endLocation: 'Pendik, İstanbul', distance: 12, startTime: '2024-11-15T13:30:00Z', completionTime: '2024-11-15T14:15:00Z', duration: 45, totalAmount: 3200, commission: 480, partnerEarning: 2720, paymentMethod: 'kredi_karti', rating: 4, vehicleType: 'Çekici - Orta Hizmet', vehiclePlate: '34 XY 9988', status: 'completed' },
    { id: 'JOB-4915', partnerId: 'PTR-002', partnerName: 'Hızlı Yol Yardım', customerId: 'USR-004', customerName: 'Burak Yıldırım', customerPhone: '0535 444 55 66', serviceType: 'Çekici Hizmeti', startLocation: 'Sarıyer, İstanbul', endLocation: 'Şişli, İstanbul', distance: 8, startTime: '2024-11-12T09:00:00Z', completionTime: '2024-11-12T09:45:00Z', duration: 45, totalAmount: 2800, commission: 420, partnerEarning: 2380, paymentMethod: 'kredi_karti', rating: 1, vehicleType: 'Çekici - Ağır Hizmet', vehiclePlate: '06 ZZ 4321', status: 'completed' },
    { id: 'JOB-4912', partnerId: 'PTR-003', partnerName: 'Mega Çekici', customerId: 'USR-005', customerName: 'Zeynep Aydın', customerPhone: '0536 555 66 77', serviceType: 'Lastik Değişimi', startLocation: 'Ataşehir, İstanbul', startTime: '2024-11-10T16:30:00Z', completionTime: '2024-11-10T17:00:00Z', duration: 30, totalAmount: 600, commission: 90, partnerEarning: 510, paymentMethod: 'nakit', rating: 5, vehicleType: 'Hafif Yardım Aracı', vehiclePlate: '35 MM 1122', status: 'completed' },
    { id: 'JOB-4910', partnerId: 'PTR-003', partnerName: 'Mega Çekici', customerId: 'USR-006', customerName: 'Caner Erkin', customerPhone: '0537 666 77 88', serviceType: 'Yakıt Desteği', startLocation: 'Beylikdüzü, İstanbul', startTime: '2024-11-08T02:00:00Z', completionTime: '2024-11-08T02:30:00Z', duration: 30, totalAmount: 400, commission: 60, partnerEarning: 340, paymentMethod: 'kredi_karti', rating: 5, vehicleType: 'Hafif Yardım Aracı', vehiclePlate: '35 TT 7890', status: 'completed' },
    { id: 'JOB-4908', partnerId: 'PTR-001', partnerName: 'Yılmaz Oto Kurtarma', customerId: 'USR-007', customerName: 'Elif Demir', customerPhone: '0538 777 88 99', serviceType: 'Çekici Hizmeti', startLocation: 'Üsküdar, İstanbul', endLocation: 'Ümraniye, İstanbul', distance: 10, startTime: '2024-11-05T08:30:00Z', completionTime: '2024-11-05T09:15:00Z', duration: 45, totalAmount: 2900, commission: 435, partnerEarning: 2465, paymentMethod: 'kredi_karti', rating: 3, vehicleType: 'Çekici - Orta Hizmet', vehiclePlate: '34 AB 1234', status: 'completed' },
    { id: 'JOB-4905', partnerId: 'PTR-002', partnerName: 'Hızlı Yol Yardım', customerId: 'USR-008', customerName: 'Ayşe Kara', customerPhone: '0539 888 99 00', serviceType: 'Akü Takviyesi', startLocation: 'Bakırköy, İstanbul', startTime: '2024-11-03T14:00:00Z', completionTime: '2024-11-03T14:30:00Z', duration: 30, totalAmount: 750, commission: 112.5, partnerEarning: 637.5, paymentMethod: 'havale', rating: 5, vehicleType: 'Hafif Yardım Aracı', vehiclePlate: '34 XY 9988', status: 'completed' },
    { id: 'JOB-4902', partnerId: 'PTR-004', partnerName: 'Anadolu Yol Yardım', customerId: 'USR-009', customerName: 'Murat Şahin', customerPhone: '0530 999 00 11', serviceType: 'Yol Yardım', startLocation: 'Çankaya, Ankara', startTime: '2024-11-01T17:30:00Z', completionTime: '2024-11-01T18:00:00Z', duration: 30, totalAmount: 550, commission: 82.5, partnerEarning: 467.5, paymentMethod: 'nakit', rating: 4, vehicleType: 'Yardım Aracı', vehiclePlate: '06 AA 3344', status: 'completed' },
    { id: 'JOB-4899', partnerId: 'PTR-005', partnerName: 'İstanbul Çekici', customerId: 'USR-010', customerName: 'Deniz Yılmaz', customerPhone: '0531 000 11 22', serviceType: 'Ağır Vasıta Çekici', startLocation: 'Gebze, Kocaeli', endLocation: 'Tuzla, İstanbul', distance: 25, startTime: '2024-10-28T10:00:00Z', completionTime: '2024-10-28T11:00:00Z', duration: 60, totalAmount: 4500, commission: 675, partnerEarning: 3825, paymentMethod: 'havale', rating: 5, vehicleType: 'Ağır Çekici', vehiclePlate: '34 FF 9900', status: 'completed' },
    { id: 'JOB-4896', partnerId: 'PTR-001', partnerName: 'Yılmaz Oto Kurtarma', customerId: 'USR-011', customerName: 'Ali Veli', customerPhone: '0532 111 22 33', serviceType: 'Çekici Hizmeti', startLocation: 'Fatih, İstanbul', endLocation: 'Bakırköy, İstanbul', distance: 15, startTime: '2024-10-25T14:00:00Z', completionTime: '2024-10-25T14:50:00Z', duration: 50, totalAmount: 2200, commission: 330, partnerEarning: 1870, paymentMethod: 'kredi_karti', rating: 4, vehicleType: 'Çekici - Orta Hizmet', vehiclePlate: '34 CD 5678', status: 'completed' },
    { id: 'JOB-4893', partnerId: 'PTR-002', partnerName: 'Hızlı Yol Yardım', customerId: 'USR-012', customerName: 'Fatma Özkan', customerPhone: '0533 222 33 44', serviceType: 'Lastik Değişimi', startLocation: 'Gaziosmanpaşa, İstanbul', startTime: '2024-10-22T11:00:00Z', completionTime: '2024-10-22T11:25:00Z', duration: 25, totalAmount: 500, commission: 75, partnerEarning: 425, paymentMethod: 'nakit', rating: 5, vehicleType: 'Hafif Yardım Aracı', vehiclePlate: '06 ZZ 4321', status: 'completed' },
  ];
  save(LS_KEYS.jobs, jobs);
  
  // Customer Requests
  const requests: Request[] = [
    { id: 'REQ-001', customerId: 'USR-001', serviceType: 'cekici', description: 'Aracım çalışmıyor, acil çekici gerekiyor', fromLocation: 'Kadıköy, İstanbul', toLocation: 'Maltepe Servis', vehicleInfo: 'Renault Clio 2016', status: 'matched', createdAt: '2024-11-27T09:00:00Z' },
    { id: 'REQ-002', customerId: 'USR-002', serviceType: 'aku', description: 'Akü tamamen bitti, takviye lazım', fromLocation: 'Beşiktaş, İstanbul', vehicleInfo: 'BMW 320i 2019', status: 'open', createdAt: '2024-11-27T10:30:00Z' },
    { id: 'REQ-003', customerId: 'USR-003', serviceType: 'lastik', description: 'Lastik patladı, yedek yok', fromLocation: 'TEM Otoyolu, İstanbul', vehicleInfo: 'Mercedes C180 2020', status: 'open', createdAt: '2024-11-27T11:00:00Z' },
    { id: 'REQ-004', customerId: 'USR-001', serviceType: 'yakit', description: 'Yakıt bitti, en yakın benzinliğe 10km', fromLocation: 'Silivri, İstanbul', vehicleInfo: 'Renault Clio 2016', status: 'completed', createdAt: '2024-11-26T14:00:00Z' },
    { id: 'REQ-005', customerId: 'USR-004', serviceType: 'cekici', description: 'Motor arızası, hareket etmiyor', fromLocation: 'Kartal, İstanbul', toLocation: 'Pendik Servis', vehicleInfo: 'Ford Focus 2018', status: 'open', createdAt: '2024-11-27T08:15:00Z' },
  ];
  save(LS_KEYS.requests, requests);
  
  // Offers
  const offers: Offer[] = [
    { id: 'OFF-001', requestId: 'REQ-001', partnerId: 'PTR-001', price: 850, etaMinutes: 25, message: 'Hemen yola çıkıyorum, 25 dakikada oradayım.', status: 'accepted', createdAt: '2024-11-27T09:05:00Z' },
    { id: 'OFF-002', requestId: 'REQ-001', partnerId: 'PTR-002', price: 900, etaMinutes: 30, message: 'Yakında bir aracım var.', status: 'rejected', createdAt: '2024-11-27T09:08:00Z' },
    { id: 'OFF-003', requestId: 'REQ-002', partnerId: 'PTR-001', price: 400, etaMinutes: 20, message: 'Akü takviye hizmeti verebilirim.', status: 'sent', createdAt: '2024-11-27T10:35:00Z' },
    { id: 'OFF-004', requestId: 'REQ-003', partnerId: 'PTR-003', price: 550, etaMinutes: 35, message: 'Lastik değişim hizmeti.', status: 'sent', createdAt: '2024-11-27T11:10:00Z' },
    { id: 'OFF-005', requestId: 'REQ-005', partnerId: 'PTR-002', price: 1200, etaMinutes: 40, message: 'Çekici gönderebilirim.', status: 'sent', createdAt: '2024-11-27T08:25:00Z' },
    { id: 'OFF-006', requestId: 'REQ-005', partnerId: 'PTR-005', price: 1100, etaMinutes: 45, message: 'Ağır çekici ile gelebilirim.', status: 'sent', createdAt: '2024-11-27T08:30:00Z' },
  ];
  save(LS_KEYS.offers, offers);
  
  localStorage.setItem(LS_KEYS.initialized, 'true');
  console.log('✅ YolMov Mock Data initialized successfully!');
}

// Auto-initialize on import
if (typeof window !== 'undefined') {
  initializeMockData();
}
