import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, MapPin, Truck, ArrowRight } from 'lucide-react';
import { JobRequest, Request } from '../../types';

interface PartnerAcceptedJobsTabProps {
  acceptedJobs: Request[];
  setActiveTab: (tab: string) => void;
  handleStartOperation: (request: JobRequest) => void;
}

const PartnerAcceptedJobsTab: React.FC<PartnerAcceptedJobsTabProps> = ({
  acceptedJobs,
  setActiveTab,
  handleStartOperation,
}) => {
  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Kabul Edilen İşler</h1>
        <p className="text-sm text-slate-600">Teklifiniz kabul edildi! İşe başlamak için "Operasyonu Başlat" butonuna basın</p>
      </div>

      {acceptedJobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-green-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Kabul Edilmiş İş Yok</h3>
          <p className="text-sm text-slate-600 mb-4">Müşteriler tekliflerinizi kabul ettiğinde burada görünecek</p>
          <button
            onClick={() => setActiveTab('requests')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
          >
            İş Taleplerini Gör
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {acceptedJobs.map((request) => {
            const jobRequest: JobRequest = {
              id: request.id,
              customerName: request.customerName || 'Müşteri',
              location: request.fromLocation || '',
              dropoffLocation: request.toLocation || '',
              vehicleInfo: request.vehicleInfo || 'Araç bilgisi yok',
              serviceType: request.serviceType === 'cekici' ? 'Çekici' : 
                          request.serviceType === 'vinc' ? 'Vinç' : 'Hizmet',
              urgency: 'normal',
              distance: '0 km',
              price: request.amount || 0,
              estimatedPrice: request.amount || 0,
              timestamp: request.createdAt || new Date().toISOString(),
              notes: request.description || '',
              _originalRequest: request,
            };

            return (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border-2 border-green-200 shadow-lg overflow-hidden hover:shadow-xl transition-all"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 size={24} className="text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg">{jobRequest.serviceType}</h3>
                        <p className="text-sm text-slate-500">{jobRequest.customerName}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                      ✅ Kabul Edildi
                    </span>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-1 gap-3 mb-4">
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-bold text-slate-700">Nereden:</p>
                        <p className="text-slate-600">{jobRequest.location}</p>
                      </div>
                    </div>
                    {jobRequest.dropoffLocation && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-bold text-slate-700">Nereye:</p>
                          <p className="text-slate-600">{jobRequest.dropoffLocation}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Truck size={16} className="text-slate-500" />
                      <p className="text-slate-600">{jobRequest.vehicleInfo}</p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-4 border-t border-slate-100">
                    <button
                      onClick={() => handleStartOperation(jobRequest)}
                      className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl text-sm font-bold hover:from-green-700 hover:to-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                      <ArrowRight size={18} />
                      Operasyonu Başlat
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PartnerAcceptedJobsTab;
