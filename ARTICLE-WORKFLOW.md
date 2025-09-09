# Article Workflow & Header Guidelines

## Article Structure Format (Google Style)

All Moonlight Analytica articles must follow this exact header structure:

### 1. Clean Header Section
```
1. Article Title (H1)
2. Meta Information (author, date, read time)
3. Red Separator Line
4. Company Logo (centered)
5. Introduction Paragraph
```

### 2. Main Content Section
After the clean header, include all rich content:
- Infographics and visualizations
- Comparison tables and matrices
- Statistical charts and graphs
- Highlight boxes and callouts
- Analysis sections
- Everything creative and engaging

## Header Template Usage

### Required Variables:
- `{{ARTICLE_TITLE}}` - Main article headline
- `{{AUTHOR_NAME}}` - Default: "Moonlight Analytica Team"
- `{{PUBLISH_DATE}}` - Format: "January 15, 2025"
- `{{READ_TIME}}` - Format: "7 min read"
- `{{PREVIEW_IMAGE}}` - Company logo file (e.g., "7a.png")
- `{{PREVIEW_ALT}}` - Alt text for logo
- `{{INTRO_PARAGRAPH}}` - Opening paragraph introducing the topic

### Header Structure:
```html
<header class="article-header">
    <h1 class="article-title">{{ARTICLE_TITLE}}</h1>
    
    <div class="article-meta">
        <div class="author-info">
            <div class="author-avatar">🌙</div>
            <span>{{AUTHOR_NAME}}</span>
        </div>
        <span>•</span>
        <span>{{PUBLISH_DATE}}</span>
        <span>•</span>
        <span>{{READ_TIME}}</span>
    </div>

    <!-- Red Separator Line -->
    <div class="separator-line"></div>

    <!-- Company Logo Section -->
    <div class="company-logo-section">
        <img src="{{PREVIEW_IMAGE}}" alt="{{PREVIEW_ALT}}" class="company-logo-image">
    </div>

    <!-- Introduction Paragraph -->
    <div class="article-intro">
        <p>{{INTRO_PARAGRAPH}}</p>
    </div>
</header>
```

## Image Assets Available

### Preview Card Images (for news.html):
- `1a.png` - OpenAI Analysis
- `2a.png` - iPhone 17 Demo
- `3a.png` - AI Lobbying
- `4a.png` - Amazon Workforce (UPDATED)
- `5a.png` - NVIDIA Blackwell (UPDATED)
- `6a.png` - AI Quality
- `7a.png` - Intel Strategic (UPDATED)
- `8a.png` - Token Arms Race
- `9a.png` - Token Context
- `10a.png` - Vision Pro

### Company Logo Mapping:
- Intel articles → `7a.png` (Intel logo)
- Amazon articles → `4a.png` (Amazon logo)
- NVIDIA articles → `5a.png` (NVIDIA logo)
- OpenAI articles → `1a.png`
- Apple articles → `2a.png` or `10a.png`
- General Tech → `6a.png` or `8a.png`

## Content Guidelines

### Header Rules (STRICT):
1. **NEVER** place infographics directly after title
2. **ALWAYS** include red separator line
3. **ALWAYS** center the company logo
4. **ALWAYS** include introduction paragraph
5. **Keep header clean and professional**

### Content Rules (CREATIVE):
1. **DO** include rich infographics below intro
2. **DO** use comparison tables and charts
3. **DO** create engaging visualizations  
4. **DO** add statistical breakdowns
5. **DO** include analysis highlights
6. **DO** make content visually compelling

## 🎨 ADVANCED ANIMATION STANDARDS

### Animation Philosophy
**ELEVATE BEYOND BASIC HOVER EFFECTS** - Inspired by homepage's rotating cube and flowing elements, create truly dynamic, creative shape animations that captivate and inform.

### 📖 **STRATEGIC STORYTELLING PRINCIPLES**

#### **Animation Must Serve The Narrative**
- **Content First**: Every animation should reinforce, clarify, or amplify the written story
- **Purposeful Motion**: Each animation should have clear narrative justification
- **Progressive Revelation**: Use animations to reveal information in logical sequence
- **Emotional Resonance**: Animations should match the emotional tone of the content
- **Cognitive Load Management**: Never overwhelm readers with competing visual elements

#### **Coherent Visual Storytelling**
- **Thematic Consistency**: Animation style should match article's core theme
  - *Financial articles*: Liquid flows, gravitational pulls, orbital systems
  - *Tech disruption*: Explosions, quantum tunnels, matrix effects  
  - *Corporate strategy*: Chess-like movements, network connections, systematic reveals
  - *AI/ML topics*: Neural networks, DNA helixes, holographic projections
- **Visual Metaphor Alignment**: Choose animations that literalize abstract concepts
- **Pacing Harmony**: Animation timing should complement reading rhythm
- **Information Hierarchy**: Most important data gets most dynamic animation

### Creative Animation Requirements:
1. **Dynamic Shape Morphing** - Elements that transform between different geometric states
2. **Particle Systems** - Data points that break apart, flow, and reassemble
3. **3D Transformations** - Cards, charts, and containers that rotate in 3D space  
4. **Organic Movements** - Liquid flows, breathing patterns, pulsing rhythms
5. **Interactive Physics** - Elements that respond with realistic motion and momentum

### Mandatory Animation Categories:

#### 🔄 **Dynamic Data Visualizations**
- **Floating Particle Numbers**: Statistics that break into particles and reform
- **Morphing Company Logos**: Logos that transform between states (e.g., chip → circuit)  
- **Liquid Data Flows**: Money/information flowing through animated pipelines
- **Breathing Charts**: Visualizations that expand/contract with natural rhythm
- **DNA Helix Data Streams**: Information spiraling up in double-helix formations
- **Magnetic Field Visualizations**: Data points following curved magnetic field lines
- **Constellation Connections**: Data points connecting like stars forming constellations
- **Ripple Effect Analytics**: Statistics creating ripple waves across surfaces
- **Quantum Tunnel Effects**: Data disappearing/reappearing through dimensional portals
- **Solar Flare Animations**: Energy bursts emanating from central data points

#### ⭕ **3D Interactive Elements** 
- **Rotating Card Systems**: Statistics cards flipping in 3D revealing hidden data
- **Orbital Data Networks**: Information orbiting around central themes like planets
- **Ring Timelines**: Circular timelines rotating with events orbiting center
- **Cube Transitions**: Content containers that rotate like homepage cube
- **Holographic Projections**: 3D wireframe models floating above content
- **Spinning Globe Visualizations**: World data represented on rotating spheres
- **Crystal Lattice Structures**: Data arranged in rotating crystalline formations
- **Gyroscope Data Models**: Multi-axis rotating information displays
- **Prism Light Refraction**: Data splitting into spectrum colors through 3D prisms
- **Levitating Platform Elements**: Content floating on antigravity platforms

#### 🌊 **Organic Shape Systems**
- **Shape-shifting Containers**: Rectangles morphing into circles, triangles, organic forms
- **Network Pulse Animations**: Interconnected nodes with flowing energy streams  
- **Particle Explosion Charts**: Bar charts exploding into particles then reforming
- **Geometric Breathing Patterns**: Background shapes expanding/contracting rhythmically
- **Fluid Dynamics Simulations**: Content flowing like viscous liquid around obstacles
- **Neural Network Synapses**: Information firing along animated neural pathways
- **Plant Growth Visualizations**: Data branches growing like living organisms
- **Wave Interference Patterns**: Overlapping circular waves creating complex patterns
- **Cellular Division Animations**: Content cells splitting and multiplying organically
- **Tornado Vortex Effects**: Data swirling in controlled tornado formations

#### ⚡ **Physics-Based Interactions**
- **Gravity Wells**: Data points being pulled toward central massive objects
- **Elastic Collision Systems**: Elements bouncing off each other with realistic physics
- **String Theory Vibrations**: Data represented as vibrating multidimensional strings
- **Pendulum Oscillations**: Information swaying in precise harmonic motions
- **Magnetic Levitation**: Charts floating and rotating without visible support
- **Lightning Branch Networks**: Electricity-like connections forming between data points
- **Tidal Force Animations**: Content stretching and compressing under gravitational influence
- **Centrifugal Force Displays**: Elements spinning outward from rotating centers
- **Kinetic Energy Transfers**: Motion passing from one element to the next
- **Wormhole Portals**: Data traveling through space-time tunnels between sections

#### 🎭 **Cinematic Transitions**
- **Film Reel Unwinding**: Content revealing as movie film strips unfurl
- **Shutter Speed Effects**: Elements appearing with camera shutter-like reveals
- **Depth of Field Shifts**: Background elements blurring/focusing cinematically
- **Parallax Storytelling**: Multiple layers moving at different speeds
- **Zoom Burst Transitions**: Content exploding outward from central focal points
- **Split Screen Reveals**: Content sliding in from opposing sides
- **Iris Wipe Effects**: Circular reveals expanding from center points
- **Matrix Digital Rain**: Characters/numbers cascading like the Matrix
- **Time Dilation Warps**: Elements slowing down/speeding up relative to each other
- **Slow Motion Explosions**: Detailed breakdowns of complex processes

### Animation Implementation Standards:
- **Minimum Duration**: 2+ seconds for complex animations
- **Easing Functions**: Use cubic-bezier for natural motion
- **Performance**: 60fps smooth animations using transform/opacity only
- **Responsive**: Animations scale appropriately on mobile devices
- **Accessibility**: Respect `prefers-reduced-motion` user preferences

### ⚠️ **STRATEGIC RESTRAINT GUIDELINES**

#### **When NOT to Animate**
- **Information Overload**: If animation competes with critical text
- **Tone Mismatch**: Playful animations in serious financial crisis stories
- **Technical Complexity**: When the concept is already difficult to grasp
- **Mobile Performance**: If animation causes lag on lower-end devices
- **Cultural Sensitivity**: Animations that might be culturally inappropriate

#### **Animation Hierarchy Rules**
1. **Single Focus Point**: Only ONE major animation per screen section
2. **Supporting Cast**: Secondary animations should be subtle and supportive
3. **Rest Areas**: Include static zones to give readers visual breaks
4. **Progressive Complexity**: Start simple, build to more complex animations
5. **Conclusion Clarity**: End sections should be calm and actionable

#### **Story-Animation Alignment Checklist**
- [ ] Animation reinforces the written narrative
- [ ] Visual metaphor makes literal sense  
- [ ] Timing matches natural reading pace
- [ ] Emotional tone matches content mood
- [ ] Key information gets appropriate visual weight
- [ ] Reader attention flows logically through content
- [ ] Animation enhances comprehension, doesn't distract
- [ ] Technical implementation serves story goals

### Style Consistency:
- Use Inter font for body text
- Use Poppins for headings
- Red separator: `#dc2626`
- Logo max-width: 200px, max-height: 80px
- Introduction paragraph: 1.1rem font-size, 1.8 line-height

## File Organization

### Template Files:
- `article-header-template.html` - Complete header template with CSS
- `sample-upgraded-article.html` - Example implementation

### Image Files:
- `Xa.png` - Preview card images (where X = 1-10)
- Company logos embedded in preview images

### News Integration:
- `news.html` - Uses preview images in card format
- Links to individual articles with full header implementation

## Implementation Checklist

For each new article:

- [ ] Copy header template from `article-header-template.html`
- [ ] Replace all `{{VARIABLE}}` placeholders
- [ ] Select appropriate company logo image
- [ ] Write compelling introduction paragraph
- [ ] Add red separator line styling
- [ ] Implement rich content below header
- [ ] Test mobile responsiveness
- [ ] Verify clean header format matches Google style
- [ ] Ensure infographics appear after intro paragraph

## Mobile Optimization

### Responsive Breakpoints:
- **Desktop**: Full layout with large logos
- **Tablet (768px)**: Adjusted font sizes and spacing
- **Mobile (480px)**: Stacked layout, smaller logos

### Mobile Considerations:
- Logo max-width: 150px on mobile
- Font sizes scale appropriately
- Introduction paragraph remains readable
- Red line maintains visibility
- Touch-friendly spacing

## Quality Standards

### Header Quality:
- Professional, clean appearance
- Consistent brand identity
- Proper typography hierarchy
- Clear visual separation

### Content Quality:
- Engaging visual elements
- Data-driven insights
- Interactive components
- Comprehensive analysis
- Professional presentation

### Animation Quality Standards:
- **Creativity First**: Every animation should tell a story or enhance understanding
- **Technical Excellence**: Smooth 60fps performance across all devices
- **Visual Impact**: Animations that create memorable, shareable moments
- **Functional Beauty**: Animations serve the content, not just decoration
- **Innovation**: Push creative boundaries with each new article

### 🎯 **STRATEGIC IMPLEMENTATION FRAMEWORK**

#### **Pre-Animation Story Analysis**
Before choosing animations, analyze your article's:
1. **Core Message**: What single idea must readers remember?
2. **Emotional Journey**: How should readers feel as they progress?
3. **Key Data Points**: Which statistics/facts need emphasis?
4. **Logical Flow**: What sequence best serves comprehension?
5. **Target Action**: What should readers do after reading?

#### **Animation Selection Criteria**
- **Narrative Relevance**: Does this animation support the story's main theme?
- **Metaphorical Accuracy**: Does the visual metaphor make sense literally?
- **Cognitive Enhancement**: Does this help readers understand complex concepts?
- **Emotional Amplification**: Does this strengthen the intended emotional impact?
- **Memory Formation**: Will this create a lasting mental image?

#### **Strategic Animation Mapping Examples**
- **Market Disruption Stories**: Use explosion/fragmentation effects when describing industry breakup
- **Growth Narratives**: Employ organic growth animations for expansion stories  
- **Financial Flow Articles**: Implement liquid dynamics for money/revenue visualization
- **Competition Analysis**: Deploy orbital systems showing market position dynamics
- **Timeline Stories**: Use cinematic reveals to show progression through time
- **Technology Breakthroughs**: Apply quantum/holographic effects for innovation themes

## 🚀 Animation Implementation Examples

### CSS Animation Foundations:
```css
/* Particle System Base */
@keyframes particleFloat {
    0% { transform: translateY(0) scale(1); opacity: 1; }
    50% { transform: translateY(-20px) scale(1.2); opacity: 0.7; }
    100% { transform: translateY(-40px) scale(0.8); opacity: 0; }
}

/* 3D Card Flip */
@keyframes cardFlip3D {
    0% { transform: rotateY(0deg) rotateX(0deg); }
    50% { transform: rotateY(90deg) rotateX(10deg); }
    100% { transform: rotateY(180deg) rotateX(0deg); }
}

/* Organic Breathing */
@keyframes organicBreathe {
    0%, 100% { transform: scale(1) rotate(0deg); border-radius: 10px; }
    25% { transform: scale(1.05) rotate(1deg); border-radius: 20px; }
    50% { transform: scale(1.1) rotate(0deg); border-radius: 50px; }
    75% { transform: scale(1.05) rotate(-1deg); border-radius: 20px; }
}

/* Liquid Flow */
@keyframes liquidFlow {
    0% { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); }
    25% { clip-path: polygon(0 20%, 100% 0, 100% 80%, 0 100%); }
    50% { clip-path: polygon(0 40%, 100% 20%, 100% 60%, 0 80%); }
    75% { clip-path: polygon(0 20%, 100% 40%, 100% 80%, 0 60%); }
    100% { clip-path: polygon(0 0, 100% 20%, 100% 100%, 0 80%); }
}

/* DNA Helix Animation */
@keyframes dnaHelix {
    0% { transform: rotateY(0deg) translateZ(0px); }
    25% { transform: rotateY(90deg) translateZ(20px); }
    50% { transform: rotateY(180deg) translateZ(0px); }
    75% { transform: rotateY(270deg) translateZ(-20px); }
    100% { transform: rotateY(360deg) translateZ(0px); }
}

/* Quantum Tunnel Effect */
@keyframes quantumTunnel {
    0% { opacity: 1; transform: scale(1) rotateZ(0deg); filter: blur(0px); }
    25% { opacity: 0.7; transform: scale(0.5) rotateZ(90deg); filter: blur(5px); }
    50% { opacity: 0; transform: scale(0.1) rotateZ(180deg); filter: blur(10px); }
    75% { opacity: 0.7; transform: scale(0.5) rotateZ(270deg); filter: blur(5px); }
    100% { opacity: 1; transform: scale(1) rotateZ(360deg); filter: blur(0px); }
}

/* Magnetic Field Lines */
@keyframes magneticField {
    0% { transform: translateX(0) translateY(0) rotate(0deg); }
    25% { transform: translateX(20px) translateY(-10px) rotate(45deg); }
    50% { transform: translateX(0) translateY(-20px) rotate(90deg); }
    75% { transform: translateX(-20px) translateY(-10px) rotate(135deg); }
    100% { transform: translateX(0) translateY(0) rotate(180deg); }
}

/* Neural Network Pulse */
@keyframes neuralPulse {
    0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); opacity: 1; }
    50% { box-shadow: 0 0 0 20px rgba(59, 130, 246, 0.2); opacity: 0.8; }
    100% { box-shadow: 0 0 0 40px rgba(59, 130, 246, 0); opacity: 0.6; }
}

/* Holographic Projection */
@keyframes holographic {
    0% { transform: perspective(1000px) rotateX(0deg) rotateY(0deg); 
         filter: drop-shadow(0 0 10px cyan); opacity: 0.8; }
    25% { transform: perspective(1000px) rotateX(5deg) rotateY(15deg); 
          filter: drop-shadow(5px 5px 15px cyan); opacity: 0.9; }
    50% { transform: perspective(1000px) rotateX(10deg) rotateY(30deg); 
          filter: drop-shadow(10px 10px 20px cyan); opacity: 1; }
    75% { transform: perspective(1000px) rotateX(5deg) rotateY(45deg); 
          filter: drop-shadow(5px 5px 15px cyan); opacity: 0.9; }
    100% { transform: perspective(1000px) rotateX(0deg) rotateY(60deg); 
           filter: drop-shadow(0 0 10px cyan); opacity: 0.8; }
}

/* Gravity Well Effect */
@keyframes gravityWell {
    0% { transform: translate(0, 0) scale(1); }
    25% { transform: translate(10px, -5px) scale(0.95); }
    50% { transform: translate(20px, -15px) scale(0.8); }
    75% { transform: translate(30px, -30px) scale(0.6); }
    100% { transform: translate(50px, -50px) scale(0.3); }
}

/* Matrix Digital Rain */
@keyframes digitalRain {
    0% { transform: translateY(-100vh); opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { transform: translateY(100vh); opacity: 0; }
}

/* Wormhole Portal */
@keyframes wormhole {
    0% { transform: scale(0) rotate(0deg); border-radius: 50%; 
         background: radial-gradient(circle, #000, #4338ca, #000); }
    50% { transform: scale(1.2) rotate(180deg); border-radius: 20%; 
          background: radial-gradient(circle, #4338ca, #000, #4338ca); }
    100% { transform: scale(0) rotate(360deg); border-radius: 50%; 
           background: radial-gradient(circle, #000, #4338ca, #000); }
}
```

---

**Last Updated**: September 2025  
**Template Version**: 3.0 - Advanced Animation Standards  
**Status**: Production Ready with Creative Animation Requirements