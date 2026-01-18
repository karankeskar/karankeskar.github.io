# Karan Keskar - Portfolio

> A modern, developer-focused portfolio showcasing my journey as a Full-Stack Software Engineer.

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://karankeskar.github.io)
[![Jekyll](https://img.shields.io/badge/Jekyll-4.x-red)](https://jekyllrb.com/)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

[**View Live Portfolio →**](https://karankeskar.github.io)

---

## About This Portfolio

This is my personal portfolio website built to showcase my software engineering projects, experience, and technical skills. The site features a clean, modern design with a distinct developer aesthetic - think terminal windows, code snippets, and smooth animations.

### Key Features

- **Modern SWE Theme** - Terminal-inspired design with floating code elements
- **Fully Responsive** - Optimized for all devices
- **Fast & Lightweight** - Built with Jekyll for optimal performance
- **Project Showcase** - Detailed portfolio section with live demos
- **Interactive Skills Section** - Visual tech stack display
- **Dynamic Content** - Easy to update via YAML configuration
- **Contact Form** - Integrated with Formspree

---

## Quick Start

### Prerequisites

- Ruby (version 2.5 or higher)
- RubyGems
- Jekyll
- Bundler

### Installation

1. **Clone the repository**
```bash
   git clone https://github.com/karankeskar/portfolio.git
   cd portfolio
```

2. **Install dependencies**
```bash
   bundle install
```

3. **Run locally**
```bash
   bundle exec jekyll serve
```

4. **View in browser**
```
   Open http://localhost:4000
```

---

## Customization

All content can be customized through the `_data/settings.yml` file without touching HTML/CSS:

### What You Can Update

- Personal Information (name, email, location)
- Hero Section & About Me
- Work Experience
- Education
- Skills & Technologies
- Projects/Portfolio Items
- Social Media Links
- Resume Link

### Example: Updating Projects

Edit `_data/settings.yml`:
```yaml
portfolio-items:
  - title: "Your Project Name"
    description: "Project description here"
    image: "assets/images/portfolio/project.jpg"
    technologies:
      - React
      - Node.js
      - MongoDB
    github: "https://github.com/yourusername/project"
    live_demo: "https://yourproject.com"
```

---

## Project Structure
```
portfolio/
├── _data/
│   └── settings.yml          # Main configuration file
├── _includes/                # Reusable components
│   ├── hero-section.html
│   ├── about-section.html
│   ├── experience-section.html
│   ├── skills-section.html
│   ├── portfolio-section.html
│   └── contact-section.html
├── _layouts/                 # Page templates
├── assets/
│   ├── css/
│   ├── images/
│   ├── js/
│   └── files/               # Store resume here
├── about.md
├── portfolio.html
├── contact.html
└── index.html
```

---

## Design Features

### Terminal-Inspired Aesthetic
- Floating code elements with smooth animations
- Terminal-style skills section (`$ cat tech-stack.sh`)
- Monospace fonts and syntax highlighting colors
- Traffic light window controls (red, yellow, green dots)

### Color Palette
- **Primary:** `#0F172A` (Slate)
- **Accent:** `#F59E0B` (Amber)
- **Success:** `#10B981` (Emerald)
- **Code Blue:** `#60A5FA`
- **Code Purple:** `#A78BFA`

### Technologies Used
- **Static Site Generator:** Jekyll
- **Styling:** Custom CSS with Bootstrap
- **Icons:** Font Awesome, Themify Icons
- **Animations:** Custom CSS keyframes
- **Forms:** Formspree integration
- **Hosting:** GitHub Pages

---

## Deployment

### GitHub Pages (Recommended)

1. Push your changes to GitHub
2. Go to repository Settings → Pages
3. Select branch: `main` or `gh-pages`
4. Site will be live at `https://yourusername.github.io/portfolio`

### Custom Domain (Optional)

1. Add `CNAME` file with your domain
2. Configure DNS records with your domain provider
3. Enable HTTPS in GitHub Pages settings

---

## Contact

- **Email:** [karankeskar058@gmail.com](mailto:karankeskar058@gmail.com)
- **LinkedIn:** [linkedin.com/in/karan-keskar](https://www.linkedin.com/in/karan-keskar/)
- **GitHub:** [github.com/karankeskar](https://github.com/karankeskar)
- **Portfolio:** [karankeskar.github.io](https://karankeskar.github.io)

---

## License & Credits

### Theme
This portfolio is built using the [Kross Jekyll Theme](https://github.com/themefisher/kross-jekyll) by [Themefisher](https://themefisher.com).

**Theme License:** [MIT License](https://github.com/themefisher/kross-jekyll/blob/main/LICENSE)

### Portfolio Content
All portfolio content, projects, and customizations © 2026 Karan Keskar. Original content and projects are not covered under the theme's MIT license.

### Images
- Profile and project images are personal content
- Stock images and illustrations have their respective licenses

---

## Contributing

While this is a personal portfolio, I'm open to suggestions for improvements:

1. Found a bug? [Open an issue](https://github.com/karankeskar/portfolio/issues)
2. Have a suggestion? Feel free to reach out
3. Want to use this as inspiration? Go for it! Just remember to credit the original theme.

---

## Roadmap

- [x] Initial portfolio setup
- [x] Add experience and education sections
- [x] Create project showcase
- [x] Implement contact form
- [x] Optimize for mobile
- [ ] Add blog section with technical articles
- [ ] Implement dark mode toggle
- [ ] Add project filtering by technology
- [ ] Create case studies for major projects
- [ ] Add testimonials section

---

## Inspiration & Resources

- Design inspiration: Modern SWE portfolios, terminal aesthetics
- Icons: [Font Awesome](https://fontawesome.com/), [Themify Icons](https://themify.me/themify-icons)
- Animations: Custom CSS animations
- Color palette: Tailwind CSS color system

---

<div align="center">

### Star this repo if you found it helpful!

**Built by Karan Keskar**

[Portfolio](https://karankeskar.github.io) • [LinkedIn](https://www.linkedin.com/in/karan-keskar/) • [GitHub](https://github.com/karankeskar)

</div>