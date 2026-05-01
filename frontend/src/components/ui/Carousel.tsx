import React, { useState, useEffect, useRef, useCallback, Children, ReactNode } from 'react';
import { clsx } from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselProps {
    children: ReactNode;
    className?: string;
    slidesToShow?: number;
    slidesToScroll?: number;
    autoplay?: boolean;
    autoplaySpeed?: number;
    infinite?: boolean;
    arrows?: boolean;
    dots?: boolean;
    centerMode?: boolean;
    variableWidth?: boolean;
    adaptiveHeight?: boolean;
    pauseOnHover?: boolean;
    beforeChange?: (currentSlide: number, nextSlide: number) => void;
    afterChange?: (currentSlide: number) => void;
}

interface SlideProps {
    children: ReactNode;
    className?: string;
}

export const Carousel: React.FC<CarouselProps> = ({
    children,
    className,
    slidesToShow = 1,
    slidesToScroll = 1,
    autoplay = false,
    autoplaySpeed = 3000,
    infinite = false,
    arrows = true,
    dots = true,
    centerMode = false,
    variableWidth = false,
    adaptiveHeight = false,
    pauseOnHover = true,
    beforeChange,
    afterChange,
}) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const sliderRef = useRef<HTMLDivElement>(null);
    const autoplayRef = useRef<NodeJS.Timeout | null>(null);
    
    const slides = Children.toArray(children);
    const slideCount = slides.length;

    // Handle autoplay
    useEffect(() => {
        if (autoplay && !isPaused) {
            autoplayRef.current = setInterval(() => {
                setCurrentSlide((prev) => {
                    const next = infinite ? (prev + slidesToScroll) % slideCount : Math.min(prev + slidesToScroll, slideCount - slidesToShow);
                    return next;
                });
            }, autoplaySpeed);
        }

        return () => {
            if (autoplayRef.current) {
                clearInterval(autoplayRef.current);
            }
        };
    }, [autoplay, autoplaySpeed, isPaused, infinite, slidesToScroll, slideCount, slidesToShow]);

    const handleBeforeChange = useCallback((nextSlide: number) => {
        if (beforeChange) {
            beforeChange(currentSlide, nextSlide);
        }
        setCurrentSlide(nextSlide);
    }, [beforeChange, currentSlide]);

    const handleAfterChange = useCallback((slide: number) => {
        if (afterChange) {
            afterChange(slide);
        }
    }, [afterChange]);

    const goToSlide = useCallback((slide: number) => {
        if (slide < 0) {
            handleBeforeChange(infinite ? slideCount - slidesToShow : 0);
        } else if (slide > slideCount - slidesToShow) {
            handleBeforeChange(infinite ? 0 : slideCount - slidesToShow);
        } else {
            handleBeforeChange(slide);
        }
        handleAfterChange(slide);
    }, [handleBeforeChange, handleAfterChange, infinite, slideCount, slidesToShow]);

    const nextSlide = useCallback(() => {
        const next = currentSlide + slidesToScroll;
        goToSlide(next >= slideCount ? (infinite ? 0 : slideCount - slidesToShow) : next);
    }, [currentSlide, slidesToScroll, goToSlide, slideCount, infinite, slidesToShow]);

    const prevSlide = useCallback(() => {
        const prev = currentSlide - slidesToScroll;
        goToSlide(prev < 0 ? (infinite ? slideCount - slidesToShow : 0) : prev);
    }, [currentSlide, slidesToScroll, goToSlide, slideCount, infinite, slidesToShow]);

    const goToDot = useCallback((index: number) => {
        goToSlide(index);
    }, [goToSlide]);

    const getSlideStyle = useCallback((index: number) => {
        const offset = index - currentSlide;
        const baseWidth = variableWidth ? 'auto' : `${100 / slidesToShow}%`;
        
        if (centerMode) {
            const centerOffset = (slidesToShow - 1) / 2;
            const translateX = (offset - centerOffset) * (100 / slidesToShow);
            const scale = Math.abs(offset - centerOffset) > 1 ? 0.8 : 1;
            const opacity = Math.abs(offset - centerOffset) > 1 ? 0.5 : 1;
            
            return {
                transform: `translateX(${translateX}%) scale(${scale})`,
                opacity,
                width: baseWidth,
                transition: 'all 0.3s ease-in-out',
            };
        }
        
        return {
            transform: `translateX(${-offset * (100 / slidesToShow)}%)`,
            width: baseWidth,
            transition: 'transform 0.3s ease-in-out',
        };
    }, [currentSlide, slidesToShow, centerMode, variableWidth]);

    const getTrackStyle = useCallback(() => {
        if (centerMode) {
            return {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: adaptiveHeight ? 'auto' : '400px',
            };
        }
        
        return {
            display: 'flex',
            height: adaptiveHeight ? 'auto' : '400px',
        };
    }, [centerMode, adaptiveHeight]);

    const canGoNext = infinite || currentSlide < slideCount - slidesToShow;
    const canGoPrev = infinite || currentSlide > 0;

    return (
        <div 
            className={clsx("relative w-full", className)}
            onMouseEnter={() => pauseOnHover && setIsPaused(true)}
            onMouseLeave={() => pauseOnHover && setIsPaused(false)}
        >
            <div className="overflow-hidden rounded-lg">
                <div ref={sliderRef} style={getTrackStyle()}>
                    {slides.map((slide, index) => (
                        <div
                            key={index}
                            className={clsx(
                                "flex-shrink-0 px-2",
                                centerMode && "transition-all duration-300"
                            )}
                            style={getSlideStyle(index)}
                        >
                            {slide}
                        </div>
                    ))}
                </div>
            </div>

            {/* Navigation Arrows */}
            {arrows && slideCount > slidesToShow && (
                <>
                    <button
                        className={clsx(
                            "absolute left-2 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white/90 text-gray-800 shadow-lg transition-all duration-200 hover:bg-white hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed",
                            !canGoPrev && "opacity-50 cursor-not-allowed"
                        )}
                        onClick={prevSlide}
                        disabled={!canGoPrev}
                        aria-label="Previous slide"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        className={clsx(
                            "absolute right-2 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white/90 text-gray-800 shadow-lg transition-all duration-200 hover:bg-white hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed",
                            !canGoNext && "opacity-50 cursor-not-allowed"
                        )}
                        onClick={nextSlide}
                        disabled={!canGoNext}
                        aria-label="Next slide"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </>
            )}

            {/* Dots Navigation */}
            {dots && slideCount > slidesToShow && (
                <div className="flex justify-center gap-2 mt-4">
                    {Array.from({ length: Math.ceil(slideCount / slidesToShow) }).map((_, index) => (
                        <button
                            key={index}
                            className={clsx(
                                "w-2 h-2 rounded-full transition-all duration-200",
                                Math.floor(currentSlide / slidesToShow) === index
                                    ? "bg-orange-500 w-8"
                                    : "bg-gray-300 hover:bg-gray-400"
                            )}
                            onClick={() => goToDot(index * slidesToShow)}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export const CarouselSlide: React.FC<SlideProps> = ({ children, className }) => (
    <div className={clsx("w-full h-full flex items-center justify-center", className)}>
        {children}
    </div>
);

// Specialized carousel variants
export const TestimonialCarousel: React.FC<Omit<CarouselProps, 'slidesToShow' | 'centerMode'>> = (props) => (
    <Carousel
        {...props}
        slidesToShow={1}
        centerMode={true}
        className={clsx("py-8", props.className)}
    />
);

export const FeatureCarousel: React.FC<Omit<CarouselProps, 'slidesToShow' | 'arrows' | 'dots'>> = (props) => (
    <Carousel
        {...props}
        slidesToShow={3}
        slidesToScroll={1}
        arrows={true}
        dots={true}
        className={clsx("px-8", props.className)}
    />
);

export const ImageCarousel: React.FC<Omit<CarouselProps, 'slidesToShow' | 'adaptiveHeight'>> = (props) => (
    <Carousel
        {...props}
        slidesToShow={1}
        adaptiveHeight={false}
        className={clsx("aspect-w-16 aspect-h-9", props.className)}
    />
);