import React from 'react';
import { Quote } from 'lucide-react';
import { TestimonialCarousel, CarouselSlide } from '../ui/Carousel';

interface CustomersContentProps {
    data: any;
}

export const CustomersContent: React.FC<CustomersContentProps> = ({ data }) => {
    return (
        <div className="p-8">
            <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Trusted by innovative companies</h2>
                <p className="text-sm text-gray-600">See what our customers have to say</p>
            </div>

            <TestimonialCarousel
                autoplay={true}
                autoplaySpeed={5000}
                dots={true}
                arrows={true}
            >
                {data.testimonials.map((testimonial: any, index: number) => (
                    <CarouselSlide key={index}>
                        <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 p-8 shadow-sm hover:shadow-md transition-shadow max-w-4xl mx-auto">
                            <div className="flex items-start gap-4">
                                <div className="text-4xl">{testimonial.logo}</div>
                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="font-bold text-gray-900">{testimonial.company}</h3>
                                            <p className="text-sm text-gray-600">
                                                {testimonial.author} • {testimonial.role}
                                            </p>
                                        </div>
                                        <Quote className="w-8 h-8 text-gray-300" />
                                    </div>

                                    <p className="text-gray-700 mb-4 italic text-lg">"{testimonial.quote}"</p>

                                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                        <div className="text-xs text-gray-600 mb-1">{testimonial.metrics.label}</div>
                                        <div className="text-2xl font-bold text-blue-600">{testimonial.metrics.value}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CarouselSlide>
                ))}
            </TestimonialCarousel>
        </div>
    );
};
