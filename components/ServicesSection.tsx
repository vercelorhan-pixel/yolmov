import React from 'react';
import { SERVICES } from '../constants';
import { motion } from 'framer-motion';

const ServicesSection: React.FC = () => {
  return (
    <section className="relative z-10 py-16 md:py-24 bg-white" id="services">
      <div className="container mx-auto px-6 md:px-12 lg:px-24 xl:px-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-brand-dark mb-4">
            Hangi Hizmete İhtiyacınız Var?
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Aracınızla ilgili her türlü sorunda uzman ekiplerimiz bir tık uzağınızda.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {SERVICES.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="group p-8 rounded-2xl border border-gray-100 bg-white hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-orange-100 transition-all duration-300 cursor-pointer"
            >
              <div className="w-14 h-14 rounded-xl bg-orange-50 flex items-center justify-center mb-6 group-hover:bg-brand-orange transition-colors duration-300">
                <service.icon 
                  className="w-7 h-7 text-brand-orange group-hover:text-white transition-colors duration-300" 
                  strokeWidth={2}
                />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-brand-orange transition-colors">
                {service.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                {service.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;