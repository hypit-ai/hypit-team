'use client'

import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useRef } from 'react'
import { experience } from '@/lib/data/experience'
import { team } from '@/lib/data/team'
import { linkById } from '@/lib/data/links'
import { useLocale } from '@/hooks/useLocale'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { gsap, ScrollTrigger, useGSAP } from '@/components/scroll/gsap'
import { writeWorldState } from '@/lib/experience/worldState'

const CompilerWorld = dynamic(
  () => import('./CompilerWorld').then((module) => module.CompilerWorld),
  { ssr: false, loading: () => <div className="ex-world-fallback" aria-hidden="true" /> },
)

const github = linkById('github')
const email = linkById('email')

function ExternalMark() {
  return <span aria-hidden="true">↗</span>
}

function ArtifactVisual({ tone }: { tone: 'source' | 'graph' | 'relay' }) {
  if (tone === 'source') {
    return (
      <div className="ex-artifact__source" aria-hidden="true">
        <span>&lt;story id=&quot;hypit&quot;&gt;</span>
        <span className="is-accent">&nbsp;&nbsp;&lt;hook at=&quot;beat:01&quot; /&gt;</span>
        <span>&nbsp;&nbsp;&lt;track source=&quot;intent&quot;&gt;</span>
        <span>&nbsp;&nbsp;&nbsp;&nbsp;&#123;&#123; narrative.compile() &#125;&#125;</span>
        <span>&nbsp;&nbsp;&lt;/track&gt;</span>
        <span>&lt;/story&gt;</span>
      </div>
    )
  }

  if (tone === 'graph') {
    return (
      <div className="ex-artifact__graph" aria-hidden="true">
        {Array.from({ length: 9 }, (_, index) => <i key={index} />)}
        <span />
      </div>
    )
  }

  return (
    <div className="ex-artifact__relay" data-ex-relay="" aria-hidden="true">
      <div className="ex-artifact__relay-track">
        <span>SOURCE</span>
        <i />
        <span>WORLD</span>
      </div>
      <div className="ex-artifact__relay-aperture">
        <span>INTENT</span>
        <span>HOOK[]</span>
        <span>GRAPH</span>
        <span>FRAME</span>
      </div>
      <div className="ex-artifact__relay-status">
        <span>INPUT / .SVML</span>
        <span>OUTPUT / RENDERABLE</span>
      </div>
    </div>
  )
}

function ManifestoVisual({ lines, index }: { lines: string[]; index: string }) {
  return (
    <div className="ex-compile__manifesto" data-ex-manifesto="" aria-hidden="true">
      <small>{index}</small>
      {lines.map((line, lineIndex) => (
        <span className="ex-compile__manifesto-line" key={`${index}-${lineIndex}`}>
          {Array.from(line).map((character, characterIndex) => (
            <i data-ex-manifest-char="" key={`${lineIndex}-${characterIndex}`}>
              {character === ' ' ? '\u00a0' : character}
            </i>
          ))}
        </span>
      ))}
    </div>
  )
}

function HeroTitle({ locale, title }: { locale: 'en' | 'cn'; title: string }) {
  const lines = locale === 'cn'
    ? ['我们不剪视频。', '我们编译意图。']
    : ["WE DON'T EDIT", 'VIDEO. WE COMPILE', 'INTENT.']

  return (
    <h1 className="ex-hero__title" aria-label={title}>
      {lines.map((line, lineIndex) => (
        <span className="ex-hero__title-line" aria-hidden="true" key={line}>
          {Array.from(line).map((character, characterIndex) => (
            <i
              data-ex-hero-char=""
              data-character={character}
              key={`${lineIndex}-${characterIndex}`}
            >
              {character === ' ' ? '\u00a0' : character}
            </i>
          ))}
        </span>
      ))}
    </h1>
  )
}

export function TeamExperience() {
  const rootRef = useRef<HTMLElement>(null)
  const heroRef = useRef<HTMLElement>(null)
  const compileRef = useRef<HTMLElement>(null)
  const pointerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { locale, t, toggle } = useLocale()
  const reduced = useReducedMotion()

  useGSAP(
    () => {
      const root = rootRef.current
      const hero = heroRef.current
      const compile = compileRef.current
      if (!root || !hero || !compile) return

      const revealNodes = gsap.utils.toArray<HTMLElement>('[data-ex-reveal]', root)
      const compileCopies = gsap.utils.toArray<HTMLElement>('.ex-compile__copy', compile)
      const compileCopyLayer = compile.querySelector<HTMLElement>('.ex-compile__copies')
      const compileMeter = compile.querySelector<HTMLElement>('.ex-compile__meter')
      const manifestos = gsap.utils.toArray<HTMLElement>('[data-ex-manifesto]', compile)
      const annotations = compile.querySelector<HTMLElement>('[data-ex-annotations]')
      const heroCharacters = gsap.utils.toArray<HTMLElement>('[data-ex-hero-char]', hero)
      const ageStage = root.querySelector<HTMLElement>('[data-ex-age-stage]')
      const ageValue = root.querySelector<HTMLElement>('[data-ex-age-value]')
      const ageTraces = gsap.utils.toArray<HTMLElement>('[data-ex-age-trace]', root)
      const relayArtifact = root.querySelector<HTMLElement>('[data-tone="relay"]')
      const fieldNotesSection = root.querySelector<HTMLElement>('[data-section="field-notes"]')
      const fieldAnnotations = gsap.utils.toArray<HTMLElement>('[data-ex-field-annotation]', root)

      if (reduced) {
        heroCharacters.forEach((character) => {
          const finalCharacter = character.dataset.character ?? ''
          character.textContent = finalCharacter === ' ' ? '\u00a0' : finalCharacter
        })
        gsap.set(revealNodes, { autoAlpha: 1, y: 0, x: 0, clearProps: 'transform' })
        gsap.set(compileCopies, { autoAlpha: 1, position: 'relative', y: 0 })
        if (ageValue) ageValue.textContent = String(team.averageAge).padStart(2, '0')
        gsap.set(ageTraces, { autoAlpha: 1, scaleX: 1 })
        writeWorldState({
          hero: 0,
          page: 0.45,
          compile: 0.72,
          artifact: 0,
          fieldNotes: 0,
          team: 1,
          scrollVelocity: 0,
        })
        return
      }

      const smoothstep = (edge0: number, edge1: number, value: number) => {
        const unit = gsap.utils.clamp(0, 1, (value - edge0) / (edge1 - edge0))
        return unit * unit * (3 - 2 * unit)
      }

      ScrollTrigger.create({
        trigger: root,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          root.style.setProperty('--ex-scroll', self.progress.toFixed(4))
          writeWorldState({
            page: self.progress,
            scrollVelocity: gsap.utils.clamp(0, 1, Math.abs(self.getVelocity()) / 2800),
          })
        },
      })

      ScrollTrigger.create({
        trigger: hero,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          root.style.setProperty('--ex-hero-progress', self.progress.toFixed(4))
          writeWorldState({ hero: self.progress })
        },
      })

      const scrambleCharacters = '#/<>*01{}[]+'.split('')
      heroCharacters.forEach((character, index) => {
        const finalCharacter = character.dataset.character ?? ''
        if (finalCharacter !== ' ') {
          character.textContent = scrambleCharacters[index % scrambleCharacters.length]
        }
        gsap.fromTo(
          character,
          { autoAlpha: 0, yPercent: 85, rotateX: -68 },
          {
            autoAlpha: 1,
            yPercent: 0,
            rotateX: 0,
            duration: 0.72,
            delay: 0.58 + index * 0.018,
            ease: 'power4.out',
            onStart: () => {
              character.textContent = finalCharacter === ' ' ? '\u00a0' : finalCharacter
            },
          },
        )
      })

      gsap.fromTo(
        gsap.utils.toArray<HTMLElement>('[data-ex-hero-meta]', hero),
        { autoAlpha: 0, y: 18 },
        { autoAlpha: 1, y: 0, duration: 0.8, delay: 1, stagger: 0.08, ease: 'power3.out' },
      )

      const settleVelocity = () => writeWorldState({ scrollVelocity: 0 })
      ScrollTrigger.addEventListener('scrollEnd', settleVelocity)

      revealNodes.forEach((node) => {
        gsap.fromTo(
          node,
          { autoAlpha: 0, y: 44 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 1.05,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: node,
              start: 'top 88%',
              once: true,
            },
          },
        )
      })

      if (relayArtifact) {
        ScrollTrigger.create({
          trigger: relayArtifact,
          start: 'top bottom',
          end: 'bottom top',
          onUpdate: (self) => {
            relayArtifact.style.setProperty('--ex-relay-progress', self.progress.toFixed(4))
            writeWorldState({ artifact: self.progress })
          },
        })
      }

      if (fieldNotesSection) {
        ScrollTrigger.create({
          trigger: fieldNotesSection,
          start: 'top bottom',
          end: 'bottom top',
          onUpdate: (self) => {
            fieldNotesSection.style.setProperty('--ex-field-progress', self.progress.toFixed(4))
            writeWorldState({ fieldNotes: self.progress })
          },
        })

        fieldAnnotations.forEach((annotation, index) => {
          gsap.fromTo(
            annotation,
            { autoAlpha: 0, x: index % 2 === 0 ? -22 : 22 },
            {
              autoAlpha: 1,
              x: 0,
              duration: 0.72,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: annotation.closest('.ex-field-note'),
                start: 'top 78%',
                once: true,
              },
            },
          )
        })
      }

      if (ageStage && ageValue) {
        const counter = { value: 0 }
        ageValue.textContent = '00'

        gsap.timeline({
          scrollTrigger: {
            trigger: ageStage,
            start: 'top 78%',
            once: true,
          },
        })
          .fromTo(
            ageStage,
            { autoAlpha: 0.5, scale: 0.965 },
            { autoAlpha: 1, scale: 1, duration: 0.72, ease: 'power3.out' },
          )
          .to(
            counter,
            {
              value: team.averageAge,
              duration: 1.18,
              ease: 'power4.out',
              onUpdate: () => {
                ageValue.textContent = Math.round(counter.value).toString().padStart(2, '0')
              },
            },
            0.08,
          )
          .fromTo(
            ageTraces,
            { autoAlpha: 0, scaleX: 0 },
            { autoAlpha: 0.72, scaleX: 1, duration: 0.48, stagger: 0.018, ease: 'power3.out' },
            0.16,
          )
      }

      ScrollTrigger.create({
        trigger: compile,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          writeWorldState({ compile: self.progress })
          const tunnelVisibility = smoothstep(0.4, 0.58, self.progress)
          root.style.setProperty('--ex-tunnel', tunnelVisibility.toFixed(4))
          root.style.setProperty('--ex-world-veil', (1 - tunnelVisibility * 0.82).toFixed(4))
          const stageLayer = 1 - smoothstep(0.45, 0.54, self.progress)
          const stageProgress = gsap.utils.clamp(0, 1, self.progress / 0.48)
          const scaled = stageProgress * (compileCopies.length - 1)
          const stage = Math.floor(scaled)
          const fraction = scaled - stage
          const linearMix = gsap.utils.clamp(0, 1, (fraction - 0.42) / 0.16)
          const stageMix = linearMix * linearMix * (3 - 2 * linearMix)
          compileCopies.forEach((copy, index) => {
            const opacity =
              index === stage
                ? 1 - stageMix
                : index === Math.min(stage + 1, compileCopies.length - 1)
                  ? stageMix
                  : 0
            gsap.set(copy, {
              autoAlpha: opacity * stageLayer,
              y: (index - scaled) * 38,
            })
          })

          gsap.set([compileCopyLayer, compileMeter].filter(Boolean), { autoAlpha: stageLayer })

          const manifestoStart = 0.52
          const manifestoSpan = (1 - manifestoStart) / manifestos.length
          manifestos.forEach((manifesto, manifestoIndex) => {
            const local = (self.progress - manifestoStart - manifestoIndex * manifestoSpan) / manifestoSpan
            const enter = smoothstep(0, 0.2, local)
            const isFinal = manifestoIndex === manifestos.length - 1
            const leave = isFinal
              ? 1 - smoothstep(0.5, 0.72, local)
              : 1 - smoothstep(0.78, 0.96, local)
            const opacity = enter * leave
            gsap.set(manifesto, {
              autoAlpha: opacity,
              y: (0.5 - gsap.utils.clamp(0, 1, local)) * 26,
            })

            const characters = manifesto.querySelectorAll<HTMLElement>('[data-ex-manifest-char]')
            characters.forEach((character, characterIndex) => {
              const scatter = ((characterIndex * 13 + manifestoIndex * 7) % 23) / 23
              const characterIn = smoothstep(scatter * 0.14, 0.16 + scatter * 0.14, local)
              gsap.set(character, {
                opacity: characterIn,
                y: (1 - characterIn) * 14,
              })
            })
          })

          if (annotations) {
            const finalSpan = manifestoSpan
            const finalStart = manifestoStart + (manifestos.length - 1) * finalSpan
            const finalLocal = (self.progress - finalStart) / finalSpan
            const annotationIn = smoothstep(0.48, 0.7, finalLocal)
            gsap.set(annotations, { autoAlpha: annotationIn })
            gsap.utils.toArray<HTMLElement>('span', annotations).forEach((annotation, index) => {
              const offset = ((index * 17) % 9) / 9
              gsap.set(annotation, {
                opacity: smoothstep(0.5 + offset * 0.12, 0.7 + offset * 0.12, finalLocal),
                y: (1 - annotationIn) * (index % 2 === 0 ? 18 : -18),
              })
            })
          }
        },
      })

      const teamSection = root.querySelector<HTMLElement>('#people')
      if (teamSection) {
        ScrollTrigger.create({
          trigger: teamSection,
          start: 'top bottom',
          end: 'bottom top',
          onUpdate: (self) => writeWorldState({ team: self.progress }),
        })
      }

      return () => ScrollTrigger.removeEventListener('scrollEnd', settleVelocity)
    },
    { scope: rootRef, dependencies: [locale, reduced], revertOnUpdate: true },
  )

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (reduced || event.pointerType === 'touch') return
    writeWorldState({
      pointerX: event.clientX / window.innerWidth - 0.5,
      pointerY: -(event.clientY / window.innerHeight - 0.5),
      pointerEnergy: Math.min(1, Math.hypot(event.movementX, event.movementY) / 24),
    })
    if (pointerTimerRef.current) clearTimeout(pointerTimerRef.current)
    pointerTimerRef.current = setTimeout(() => writeWorldState({ pointerEnergy: 0 }), 120)
  }

  return (
    <main
      ref={rootRef}
      className={`ex-root${reduced ? ' is-reduced-motion' : ''}`}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => writeWorldState({ pointerX: 0, pointerY: 0, pointerEnergy: 0 })}
    >
      <div className="ex-world" aria-hidden="true">
        <CompilerWorld />
      </div>
      <div className="ex-grid" aria-hidden="true" />

      <header className="ex-nav" aria-label={locale === 'cn' ? '主导航' : 'Primary navigation'}>
        <a className="ex-nav__wordmark" href="#top">
          <span>HYPIT</span>
          <i>AI</i>
        </a>
        <div className="ex-nav__tools">
          <button className="ex-nav__language" type="button" onClick={toggle}>
            {locale === 'en' ? '中文' : 'EN'}
          </button>
          {email?.url ? (
            <a className="ex-nav__cta" href={email.url}>
              {locale === 'cn' ? '联系我们' : 'BUILD WITH US'} <ExternalMark />
            </a>
          ) : null}
        </div>
      </header>

      <aside className="ex-hud" aria-hidden="true">
        <span>SVML / RUNTIME</span>
        <span>22.5431° N</span>
        <span>113.9555° E</span>
      </aside>

      <section ref={heroRef} id="top" className="ex-hero" data-section="hero">
        <div className="ex-hero__sticky">
          <div className="ex-loader" aria-hidden="true">
            <div className="ex-loader__status">
              <span className="ex-loader__pixels">
                {Array.from({ length: 9 }, (_, index) => <i key={index} />)}
              </span>
              <span className="ex-loader__label">INITIALIZING NARRATIVE RUNTIME</span>
              <span className="ex-loader__mode">DRIVE / 01</span>
            </div>
            <b><i /></b>
          </div>
          <div className="ex-hero__top" data-ex-hero-meta="">
            <p className="ex-hero__eyebrow">{experience.hero.eyebrow}</p>
            <p>VIDEO AS SOURCE / 001</p>
          </div>
          <div className="ex-hero__copy">
            <HeroTitle locale={locale} title={t(experience.hero.title)} />
            <p className="ex-hero__body" data-ex-hero-meta="">{t(experience.hero.body)}</p>
          </div>
          <div className="ex-hero__telemetry" data-ex-hero-meta="" aria-hidden="true">
            <span>INTENT</span><i />
            <span>SYNTAX</span><i />
            <span>WORLD</span>
          </div>
          <div className="ex-hero__footer" data-ex-hero-meta="">
            <span>{t(experience.hero.scroll)}</span>
            <span className="ex-hero__scroll-line" aria-hidden="true" />
            <span>SCROLL / 000</span>
          </div>
        </div>
      </section>

      <section className="ex-thesis" data-section="thesis">
        <p className="ex-kicker" data-ex-reveal="">{experience.thesis.index}</p>
        <div className="ex-thesis__body">
          <h2 data-ex-reveal="">{t(experience.thesis.title)}</h2>
          <p data-ex-reveal="">{t(experience.thesis.body)}</p>
        </div>
        <p className="ex-thesis__side" aria-hidden="true">SOURCE → GRAPH → WORLD</p>
      </section>

      <section className="ex-artifacts" data-section="artifacts" aria-labelledby="artifacts-title">
        <div className="ex-section-head" data-ex-reveal="">
          <p className="ex-kicker">01 / MATERIALS</p>
          <h2 id="artifacts-title">{locale === 'cn' ? '我们正在构建什么。' : 'WHAT WE ARE BUILDING.'}</h2>
        </div>
        <div className="ex-artifacts__grid">
          {experience.artifacts.map((artifact) => (
            <article
              className="ex-artifact"
              data-tone={artifact.tone}
              data-ex-reveal=""
              key={artifact.index}
              onPointerEnter={artifact.tone === 'relay'
                ? () => writeWorldState({ artifactFocus: 1 })
                : undefined}
              onPointerLeave={artifact.tone === 'relay'
                ? () => writeWorldState({ artifactFocus: 0 })
                : undefined}
            >
              <div className="ex-artifact__meta">
                <span>{artifact.index}</span>
                <span>{t(artifact.label)}</span>
              </div>
              <ArtifactVisual tone={artifact.tone} />
              <div className="ex-artifact__copy">
                <strong>{artifact.metric}</strong>
                <h3>{t(artifact.title)}</h3>
                <p>{t(artifact.body)}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="ex-field-notes" data-section="field-notes" aria-labelledby="field-notes-title">
        <div className="ex-field-notes__intro">
          <p className="ex-kicker" data-ex-reveal="">{experience.fieldNotes.index}</p>
          <h2 id="field-notes-title" data-ex-reveal="">{t(experience.fieldNotes.title)}</h2>
          <p data-ex-reveal="">{t(experience.fieldNotes.body)}</p>
        </div>
        <div className="ex-field-notes__axis" aria-hidden="true">
          <span>LANGUAGE</span>
          <i />
          <span>ROOM</span>
          <i />
          <span>RENDER</span>
        </div>
        <div className="ex-field-notes__grid">
          {experience.fieldNotes.items.map((item, noteIndex) => (
            <figure
              className={`ex-field-note is-${item.className}`}
              data-ex-reveal=""
              key={item.index}
              onPointerEnter={() => writeWorldState({ activeNote: noteIndex })}
              onPointerLeave={() => writeWorldState({ activeNote: -1 })}
            >
              <div className="ex-field-note__image">
                <Image
                  src={item.src}
                  alt={t(item.alt)}
                  fill
                  unoptimized
                  sizes={item.className === 'founder' || item.className === 'working'
                    ? '(max-width: 768px) 92vw, 42vw'
                    : '(max-width: 768px) 92vw, 48vw'}
                />
                <span aria-hidden="true">{item.index}</span>
              </div>
              <figcaption>
                <span>{item.index}</span>
                <p>{t(item.caption)}</p>
              </figcaption>
              <div className="ex-field-note__annotation" data-ex-field-annotation="" aria-hidden="true">
                <span>ANCHOR / {String(noteIndex + 1).padStart(2, '0')}</span>
                {t(item.signals).map((signal) => <strong key={signal}>{signal}</strong>)}
                <i />
              </div>
            </figure>
          ))}
        </div>
      </section>

      <section ref={compileRef} className="ex-compile" data-section="compile" aria-labelledby="compile-title">
        <div className="ex-compile__sticky">
          <div className="ex-compile__header">
            <p className="ex-kicker">03—06 / COMPILER JOURNEY</p>
            <p>SCROLL DRIVEN / 4 STAGES</p>
          </div>
          <h2 id="compile-title" className="sr-only">
            {locale === 'cn' ? '编译流程' : 'The compiler journey'}
          </h2>
          <ol className="ex-compile__copies">
            {experience.stages.map((stage) => (
              <li className="ex-compile__copy" key={stage.index}>
                <div className="ex-compile__number">{stage.index}</div>
                <p>{stage.verb}</p>
                <h3>{t(stage.title)}</h3>
                <span>{t(stage.body)}</span>
                <small>{stage.signal}</small>
              </li>
            ))}
          </ol>
          <div className="ex-compile__manifestos">
            {experience.manifestos.map((manifesto) => (
              <ManifestoVisual
                key={manifesto.index}
                index={manifesto.index}
                lines={t(manifesto.lines)}
              />
            ))}
            <div className="ex-compile__annotations" data-ex-annotations="" aria-hidden="true">
              <span>{locale === 'cn' ? '源码优先。持续重编译。' : 'SOURCE FIRST. RENDER FOREVER.'}</span>
              <span>{locale === 'cn' ? '意图始终可检查。' : 'INTENT STAYS INSPECTABLE.'}</span>
              <span>{locale === 'cn' ? '七位建设者。一个编译器。' : 'SEVEN BUILDERS. ONE COMPILER.'}</span>
              <span>{locale === 'cn' ? 'AI 创作。系统解析。' : 'AI AUTHORS. SYSTEMS RESOLVE.'}</span>
            </div>
          </div>
          <div className="ex-compile__meter" aria-hidden="true">
            {experience.stages.map((stage) => <i key={stage.index} />)}
          </div>
        </div>
      </section>

      <section id="people" className="ex-people" data-section="people" aria-labelledby="people-title">
        <p className="ex-kicker" data-ex-reveal="">{experience.team.index}</p>
        <div className="ex-people__intro">
          <div className="ex-age" data-ex-age-stage="">
            <div className="ex-age__meta">
              <span>{locale === 'cn' ? '团队平均年龄' : 'AVERAGE AGE'}</span>
              <span>TEAM / 07</span>
            </div>
            <strong className="ex-age__number" aria-hidden="true">
              <span data-ex-age-value="">00</span>
            </strong>
            <span className="ex-age__trace" aria-hidden="true">
              {Array.from({ length: team.averageAge }, (_, index) => (
                <i data-ex-age-trace="" key={index} />
              ))}
            </span>
            <p>{t(team.hook)}</p>
          </div>
          <div className="ex-people__copy">
            <h2 id="people-title" data-ex-reveal="">{t(experience.team.title)}</h2>
            <p data-ex-reveal="">{t(experience.team.body)}</p>
          </div>
        </div>
        <div className="ex-people__list">
          {team.members.map((member, index) => (
            <article
              className="ex-person"
              key={member.id}
              tabIndex={0}
              data-ex-reveal=""
              onPointerEnter={() => writeWorldState({ activeMember: index })}
              onFocus={() => writeWorldState({ activeMember: index })}
            >
              <span className="ex-person__index">{member.index}</span>
              <div className="ex-person__name">
                <h3>{member.enName ?? member.name}</h3>
                <span>{member.enName ? member.name : null}</span>
              </div>
              <div className="ex-person__position">
                <p className="ex-person__role">{t(member.role)}</p>
                <p className="ex-person__org">{t(member.org)}</p>
              </div>
              <p className="ex-person__profile">{t(member.profile)}</p>
              <span className="ex-person__arrow" aria-hidden="true">↗</span>
            </article>
          ))}
        </div>
      </section>

      <footer className="ex-footer" data-section="footer">
        <p className="ex-kicker" data-ex-reveal="">{experience.footer.index}</p>
        <p className="ex-footer__statement" data-ex-reveal="">{t(experience.footer.title)}</p>
        <div className="ex-footer__actions">
          {github?.url ? (
            <a href={github.url} target="_blank" rel="noreferrer">
              {t(experience.footer.source)} <ExternalMark />
            </a>
          ) : null}
          {email?.url ? (
            <a href={email.url}>{t(experience.footer.contact)} <ExternalMark /></a>
          ) : null}
        </div>
        <div className="ex-footer__meta">
          <span>HYPIT AI · SHENZHEN</span>
          <span>NARRATAGE / SVML</span>
          <span>© 2026</span>
        </div>
      </footer>
    </main>
  )
}

export default TeamExperience
