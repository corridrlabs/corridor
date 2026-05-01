import React, { useEffect, useRef } from 'react';

type Point = {
    x: number;
    y: number;
    tx: number; // target x
    ty: number; // target y
    vx: number;
    vy: number;
};

export const GlobalBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = 0;
        let height = 0;
        let particles: Point[] = [];
        let animationFrameId: number;
        let currentShape = 0; // 0: Random, 1: Heap, 2: Person

        // Initialize dimensions
        const resize = () => {
            width = container.offsetWidth;
            height = container.offsetHeight;
            canvas.width = width;
            canvas.height = height;
            initParticles(); // Re-init on resize to fit new bounds
        };

        // Create Particles
        const initParticles = () => {
            particles = [];
            const count = Math.min(200, Math.floor((width * height) / 9000)); // Responsive count

            for (let i = 0; i < count; i++) {
                particles.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    tx: Math.random() * width,
                    ty: Math.random() * height,
                    vx: 0,
                    vy: 0,
                });
            }
            setShape(currentShape);
        };

        const setShape = (shapeIndex: number) => {
            currentShape = shapeIndex;

            particles.forEach((p, i) => {
                let tx, ty;

                if (shapeIndex === 0) {
                    // RANDOM / GALAXY DUST
                    tx = Math.random() * width;
                    ty = Math.random() * height;
                } else if (shapeIndex === 1) {
                    // HEAP OF MONEY (Pyramid/Pile at bottom)
                    // Bell curve distribution for x, bottom heavy for y
                    const randomVal = () => {
                        let u = 0, v = 0;
                        while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
                        while (v === 0) v = Math.random();
                        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
                    }

                    // Simple triangle/heap
                    const row = Math.floor(Math.sqrt(i * 2));
                    // Scatter around bottom center
                    const spread = Math.min(width * 0.8, 600);
                    const centerX = width / 2;
                    const bottomY = height - 50;

                    // Random point in a triangle form
                    const r1 = Math.random();
                    const r2 = Math.random();

                    // Triangle coordinate mapping
                    // P = (1 - sqrt(r1)) * A + (sqrt(r1) * (1 - r2)) * B + (sqrt(r1) * r2) * C
                    // A=(center, top), B=(left, bottom), C=(right, bottom)

                    const heapHeight = Math.min(height * 0.4, 300);

                    // Using simple randomization within a trapezoid
                    // bias Y towards bottom
                    const yBias = 1 - Math.pow(Math.random(), 2); // 0 to 1, biased to 1
                    ty = bottomY - (yBias * heapHeight);

                    // Width at this Y
                    const currentWidthSpread = spread * (yBias); // wider at bottom
                    tx = centerX + (Math.random() - 0.5) * currentWidthSpread;

                } else {
                    // PERSON (Simple Silhouette)
                    const centerX = width / 2;
                    const hasHead = i < particles.length * 0.15; // 15% head
                    const hasBody = !hasHead && i < particles.length * 0.6; // 45% body
                    // Rest limbs

                    const centerY = height / 2;
                    const scale = Math.min(width, height) * 0.003;

                    if (hasHead) {
                        // Circle
                        const radius = 40 * scale;
                        const angle = Math.random() * Math.PI * 2;
                        const r = Math.sqrt(Math.random()) * radius;
                        tx = centerX + Math.cos(angle) * r;
                        ty = centerY - (100 * scale) + Math.sin(angle) * r;
                    } else if (hasBody) {
                        // Rect
                        const bodyW = 60 * scale;
                        const bodyH = 100 * scale;
                        tx = centerX + (Math.random() - 0.5) * bodyW;
                        ty = centerY + (Math.random() - 0.5) * bodyH;
                    } else {
                        // Limbs (Lines)
                        // Randomly assign to left/right arm/leg
                        const limb = Math.floor(Math.random() * 4);
                        const limbW = 15 * scale;
                        const limbL = 90 * scale;

                        let startX, startY, dirX, dirY;

                        if (limb === 0) { // Left Arm
                            startX = centerX - 25 * scale; startY = centerY - 40 * scale;
                            dirX = -1; dirY = 0.5;
                        } else if (limb === 1) { // Right Arm
                            startX = centerX + 25 * scale; startY = centerY - 40 * scale;
                            dirX = 1; dirY = 0.5;
                        } else if (limb === 2) { // Left Leg
                            startX = centerX - 15 * scale; startY = centerY + 50 * scale;
                            dirX = -0.3; dirY = 1;
                        } else { // Right Leg
                            startX = centerX + 15 * scale; startY = centerY + 50 * scale;
                            dirX = 0.3; dirY = 1;
                        }

                        const progress = Math.random();
                        tx = startX + (dirX * limbL * progress) + (Math.random() - 0.5) * limbW;
                        ty = startY + (dirY * limbL * progress) + (Math.random() - 0.5) * limbW;
                    }
                }

                p.tx = tx;
                p.ty = ty;
            });
        };

        // Animation Loop
        const draw = () => {
            // Clear canvas (keep transparent to show CSS background layers)
            ctx.clearRect(0, 0, width, height);

            // Update & Draw Particles
            ctx.fillStyle = '#94a3b8'; // Slate-400

            particles.forEach(p => {
                // Physics: Spring to target
                const dx = p.tx - p.x;
                const dy = p.ty - p.y;

                p.vx += dx * 0.005; // spring constant
                p.vy += dy * 0.005;
                p.vx *= 0.92; // friction
                p.vy *= 0.92;

                // Add some noise/float
                p.vx += (Math.random() - 0.5) * 0.2;
                p.vy += (Math.random() - 0.5) * 0.2;

                p.x += p.vx;
                p.y += p.vy;

                // Draw dot
                ctx.beginPath();
                ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                ctx.fill();
            });

            // Draw Connections
            ctx.strokeStyle = '#64748b'; // Slate-500
            ctx.lineWidth = 0.5;

            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 80) { // Connection threshold
                        ctx.globalAlpha = 1 - (dist / 80);
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }
            ctx.globalAlpha = 1;

            animationFrameId = requestAnimationFrame(draw);
        };

        // Cycle Shapes
        const intervalId = setInterval(() => {
            const nextShape = (currentShape + 1) % 3;
            setShape(nextShape);
        }, 8000); // Change every 8s

        // Setup
        window.addEventListener('resize', resize);
        resize();
        draw();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
            clearInterval(intervalId);
        };
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
            {/* Main background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0]" />

            {/* Alien/surface texture */}
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage: `
                        radial-gradient(circle at 15% 50%, rgba(120, 119, 198, 0.1) 0px, transparent 50%),
                        radial-gradient(circle at 85% 30%, rgba(255, 119, 198, 0.08) 0px, transparent 50%),
                        radial-gradient(circle at 50% 80%, rgba(56, 189, 248, 0.08) 0px, transparent 50%)
                    `,
                    backgroundSize: '200% 200%',
                    animation: 'textureFloat 20s ease-in-out infinite alternate'
                }}
            />

            {/* Corrugated cardboard-like pattern */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `
                        linear-gradient(90deg, transparent 79px, #64748b 79px, #64748b 81px, transparent 81px),
                        linear-gradient(transparent 79px, #64748b 79px, #64748b 81px, transparent 81px)
                    `,
                    backgroundSize: '100px 100px',
                    transform: 'rotate(10deg) scale(1.5)',
                }}
            />

            {/* Animated Canvas Particle Layer */}
            <div ref={containerRef} className="absolute inset-0">
                <canvas ref={canvasRef} className="block w-full h-full" style={{ background: 'transparent' }} />
            </div>

            {/* Global Styles for Animations */}
            <style dangerouslySetInnerHTML={{
                __html: `
                    @keyframes textureFloat {
                        0%, 100% { background-position: 0% 0%; }
                        50% { background-position: 100% 100%; }
                    }
                `
            }} />
        </div>
    );
};
