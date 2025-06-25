import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden min-h-[100vh] flex items-center justify-center py-8 sm:py-12 md:py-16 bg-gradient-to-b from-background to-muted">
      {/* Canvas background elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-secondary/10 rounded-full blur-3xl" />
      </div>
      
      <div className="container px-4 md:px-6 relative z-10 w-full">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-block px-4 py-1.5 mb-4 sm:mb-6 text-sm font-medium rounded-full bg-primary/10 text-primary">
            Professional AI Headshots
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl mb-4 sm:mb-6">
            Welcome to our Headshots AI MVP
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg md:text-xl mb-6 sm:mb-8 max-w-2xl mx-auto">
            Transform your photos into professional headshots in seconds with our AI technology.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full group">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}



// import Link from "next/link"
// import { ArrowRight } from "lucide-react"
// import { Button } from "@/components/ui/button"
// import { Badge } from "@/components/ui/badge"
// import TrustBadges from "@/components/homepage/trust-badges"
// import ThreeDBeforeAfterGallery from "@/components/homepage/3d-before-after-gallery"

// export default function HeroSection() {
//   return (
//     <section className="relative overflow-hidden py-16 md:py-24">
//       <div className="container px-4 md:px-6">
//         <div className="mx-auto max-w-3xl text-center mb-8">
//           <Badge className="mb-4" variant="outline">
//             THE #1 RANKED AI HEADSHOT COMPANY
//           </Badge>
//           <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl mb-6">
//             The Leading AI Headshot Generator for <span className="text-primary">Professionals</span>
//           </h1>
//           <p className="text-muted-foreground text-lg md:text-xl max-w-[800px] mx-auto">
//             Turn your selfies into studio-quality headshots in minutes. Save hundreds of dollars and hours of your time.
//           </p>
//           <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
//             <Link href="/login" className="w-full sm:w-auto">
//               <Button size="lg" className="group">
//                 Create your headshots now
//                 <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
//               </Button>
//             </Link>
//           </div>
//         </div>

//         {/* Trust Badges */}
//         {/* <div className="mt-8">
//           <TrustBadges />
//         </div> */}

//         <div className="mt-12">
//           <ThreeDBeforeAfterGallery />
//         </div>
//       </div>
//     </section>
//   )
// }
