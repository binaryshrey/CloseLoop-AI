"use client";

import { AnimatedGroup } from "@/components/ui/animated-group";

const transitionVariants = {
  item: {
    hidden: {
      opacity: 0,
      filter: "blur(12px)",
      y: 12,
    },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        type: "spring" as const,
        bounce: 0.3,
        duration: 1.5,
      },
    },
  },
};

interface DigitalWorker {
  name: string;
  title: string;
  description: string;
  videoSrc: string;
  videoPoster?: string;
  status?: string;
  statusBadge?: string;
  notificationText?: string;
}

export interface DigitalWorkersProps {
  title?: string;
  description?: string;
  workers?: DigitalWorker[];
}

const DEFAULT_WORKERS: DigitalWorker[] = [
  {
    name: "Alice",
    title: "AI Phone Agent",
    description:
      "Alice learns from every call, adapts to your business needs, and elevates your customer relationships around the clock.",
    videoSrc: "/alice-video.mp4",
    status: "Alice - AI Phone Agent",
    statusBadge: "Active",
    notificationText: "Currently on call with Sarah Johnson",
  },
  {
    name: "Julian",
    title: "AI Leads Agent",
    description:
      "Julian transforms your market into your revenue. He engages prospects across channels, driving qualified meetings and building pipeline.",
    videoSrc: "/julian-video.mp4",
    status: "Julian - AI Leads Agent",
    statusBadge: "Active",
    notificationText: "Sent personalized outreach to 47 new prospects",
  },
];

export function DigitalWorkers({
  title = "Meet our digital workers",
  description = "Our AI agents don't just manage leads – they transform your pipeline into predictable revenue. With 24/7 autonomous operations, intelligent prospect qualification, and personalized multi-channel engagement, they're revolutionizing how sales teams close deals.",
  workers = DEFAULT_WORKERS,
}: DigitalWorkersProps) {
  return (
    <section className="bg-background py-16 md:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <AnimatedGroup
          variants={{
            container: {
              visible: {
                transition: {
                  staggerChildren: 0.1,
                },
              },
            },
            ...transitionVariants,
          }}
          className="mx-auto max-w-6xl text-center"
        >
          <h2 className="text-foreground text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {title}
          </h2>
          <p className="text-muted-foreground mt-6 text-lg leading-8">
            {description}
          </p>
        </AnimatedGroup>

        {/* Workers Grid */}
        <div className="mt-16 grid gap-8 md:mt-20 lg:grid-cols-2 lg:gap-12">
          {workers.map((worker, index) => (
            <AnimatedGroup
              key={worker.name}
              variants={{
                container: {
                  visible: {
                    transition: {
                      staggerChildren: 0.1,
                      delayChildren: 0.2 + index * 0.1,
                    },
                  },
                },
                ...transitionVariants,
              }}
              className="group relative"
            >
              {/* Card */}
              <div className="relative overflow-hidden rounded-3xl transition-all duration-300">
                {/* Video Container */}
                <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-black/5">
                  <video
                    className="size-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                    poster={worker.videoPoster}
                  >
                    <source src={worker.videoSrc} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>

                  {/* Gradient Overlay */}
                  <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />

                  {/* Status Badge - Top */}
                  <div className="absolute left-6 top-6 flex items-center gap-3">
                    <div className="bg-background/90 backdrop-blur-md rounded-full px-4 py-2 border border-white/10 shadow-lg">
                      <span className="text-foreground text-sm font-medium">
                        {worker.status}
                      </span>
                    </div>
                    <div className="bg-green-500/90 backdrop-blur-md rounded-full px-3 py-1.5 border border-green-400/20 shadow-lg">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                        <span className="text-xs font-medium text-white">
                          {worker.statusBadge}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Notification - Bottom */}
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="bg-background/95 backdrop-blur-md rounded-2xl border border-white/10 p-4 shadow-xl">
                      <div className="flex items-start gap-3">
                        <div className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-full">
                          <svg
                            className="text-primary size-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-foreground text-sm font-medium">
                            {worker.notificationText}
                          </p>
                          <p className="text-muted-foreground mt-1 text-xs">
                            Just now
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Worker Info - Below Video */}
                <div className="mt-6">
                  <h3 className="text-foreground mb-2 text-3xl font-bold lg:text-4xl">
                    {worker.name}{" "}
                    <span className="text-muted-foreground text-2xl font-normal lg:text-3xl">
                      – {worker.title}
                    </span>
                  </h3>
                  <p className="text-muted-foreground text-base leading-7 lg:text-lg">
                    {worker.description}
                  </p>
                </div>

                {/* Hover Effect */}
                <div className="absolute inset-0 -z-10 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100">
                  <div className="from-primary/20 to-primary/5 absolute inset-0 bg-linear-to-br" />
                </div>
              </div>
            </AnimatedGroup>
          ))}
        </div>
      </div>
    </section>
  );
}

export default DigitalWorkers;
