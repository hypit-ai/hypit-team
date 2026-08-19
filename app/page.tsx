/**
 * `/` — Hypit Team Experience.
 *
 * The old 17-section editorial components remain in the repository; this route now
 * presents the company through one narrative workflow and one persistent WebGL world.
 * Lenis and GSAP still share the existing single animation clock.
 */

import { SmoothScroll } from '@/components/scroll/SmoothScroll'
import { TeamExperience } from '@/components/experience/TeamExperience'
import './team-experience.css'

export default function Home() {
  return (
    <SmoothScroll theme={false}>
      <TeamExperience />
    </SmoothScroll>
  )
}
