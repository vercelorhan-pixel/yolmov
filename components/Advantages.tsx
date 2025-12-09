import React from 'react';
import { ADVANTAGES } from '../constants';

const Advantages: React.FC = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-6 md:px-12 lg:px-24 xl:px-32">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {ADVANTAGES.map((adv) => (
            <div key={adv.id} className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-xl hover:bg-orange-50/50 transition-colors">
              <div className="mb-4 p-3 bg-white rounded-xl shadow-sm">
                <adv.icon className="w-6 h-6 text-brand-orange" />
              </div>
              <h4 className="font-bold text-gray-800 text-sm md:text-base">{adv.title}</h4>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Advantages;