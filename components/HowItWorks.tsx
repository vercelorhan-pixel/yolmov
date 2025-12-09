
import React from 'react';
import { HOW_IT_WORKS_STEPS } from '../constants';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const HowItWorks: React.FC = () => {
  return (
    <section className="py-24 bg-gray-50 relative overflow-hidden">
      {/* Decorative Background Blobs */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-orange-100/40 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-blue-100/40 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>

      <div className="container mx-auto px-6 md:px-12 lg:px-24 xl:px-32 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-20 max-w-3xl mx-auto">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-brand-orange font-bold uppercase tracking-wider text-xs md:text-sm mb-3 block"
          >
            Kolay Kullanım
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-display font-bold text-brand-dark mb-6"
          >
            Yolmov Nasıl Çalışır?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-500 text-lg font-light"
          >
            Karmaşık süreçlerle uğraşmayın. Sadece 3 basit adımda, ihtiyacınız olan uzman yardımı bulunduğunuz konuma yönlendiriyoruz.
          </motion.p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          
          {/* Connecting Line (Desktop Only) */}
          <div className="hidden md:block absolute top-[40%] left-10 right-10 h-0.5 bg-gradient-to-r from-gray-200 via-brand-orange/30 to-gray-200 -z-0 border-t border-dashed border-gray-300"></div>

          {HOW_IT_WORKS_STEPS.map((step, index) => (
            <motion.div 
              key={step.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="relative bg-white p-8 rounded-[2rem] shadow-xl shadow-gray-100/50 border border-gray-100 hover:-translate-y-2 transition-transform duration-500 z-10 group overflow-hidden"
            >
              {/* Step Number Watermark */}
              <div className="absolute -top-6 -right-6 text-[8rem] font-display font-black text-gray-50 group-hover:text-orange-50/60 transition-colors select-none -z-10 pointer-events-none leading-none">
                0{step.id}
              </div>

              <div className="w-16 h-16 bg-gradient-to-br from-orange-50 to-white border border-orange-100 rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all duration-300 group-hover:bg-brand-orange group-hover:border-brand-orange">
                <step.icon className="w-7 h-7 text-brand-orange group-hover:text-white transition-colors duration-300" strokeWidth={2} />
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-brand-orange transition-colors">
                {step.title}
              </h3>
              <p className="text-gray-500 leading-relaxed text-sm md:text-base">
                {step.description}
              </p>
              
              {/* Mobile Flow Indicator */}
              {index < 2 && (
                 <div className="md:hidden absolute bottom-4 right-4 text-orange-100">
                    <ArrowRight className="rotate-90 w-6 h-6" />
                 </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
