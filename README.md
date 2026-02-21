# 🧹 Digital Clean Day

A modern, premium Chrome Extension that helps you maintain a clean browser and track your digital wellbeing.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

### 🎯 Smart Cleaning
- **Unused Tabs** - Automatically close tabs not used in 7 days
- **Tracking Cookies** - Remove ads and tracking cookies only
- **Cache & Storage** - Clear temporary files safely

### 📊 Screen Time Tracking
- Real-time activity monitoring
- Daily usage statistics
- Progress bar with goals
- Automatic daily reset

### 🌙 Modern UI
- Glassmorphism design
- Dark mode support
- Smooth animations
- Premium feel

### ⏰ Auto-Clean Schedule
- Manual clean only
- Weekly auto clean
- Bi-weekly auto clean
- Monthly auto clean

### 🔒 Safety First
Never deletes:
- Passwords
- Logins
- Bookmarks
- History
- Personal data

## 🚀 Installation

### From Source

1. Clone this repository:
```bash
git clone https://github.com/vivekx11/digital-clean-day-extension.git
```

2. Open Chrome and go to `chrome://extensions/`

3. Enable "Developer mode" (toggle in top-right)

4. Click "Load unpacked"

5. Select the extension folder

6. Done! Click the extension icon to start

### From Chrome Web Store
Coming soon!

## 📸 Screenshots

### Main Interface
Modern glassmorphism design with screen time tracking

### Dark Mode
Beautiful dark theme for night-time browsing

### Cleaning Progress
Smooth animations during cleaning process

## 🎨 Design Features

- **Glassmorphism** - Frosted glass effect with backdrop blur
- **Smooth Animations** - Hover effects, transitions, and micro-interactions
- **Color Palette** - Calming purple-blue gradient
- **Typography** - Inter font for modern look
- **Responsive** - Optimized 380px popup layout

## 🛠️ Tech Stack

- HTML5
- CSS3 (Glassmorphism, Animations)
- Vanilla JavaScript
- Chrome Extension APIs
  - Tabs API
  - Cookies API
  - BrowsingData API
  - Storage API
  - Alarms API
  - Idle API

## 📋 Permissions

- `tabs` - Manage browser tabs
- `cookies` - Remove tracking cookies
- `browsingData` - Clear cache and storage
- `storage` - Save settings and track usage
- `alarms` - Schedule automatic cleaning
- `idle` - Track active/inactive time

## 🔧 Development

### Project Structure
```
digital-clean-day-extension/
├── manifest.json           # Extension configuration
├── popup.html             # Main UI
├── popup.css              # Styling
├── popup.js               # UI logic
├── background.js          # Service worker
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── create-placeholder-icons.html
```

### Local Development

1. Make your changes
2. Go to `chrome://extensions/`
3. Click reload icon on the extension
4. Test your changes

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Vivek**
- GitHub: [@vivekx11](https://github.com/vivekx11)

## 🙏 Acknowledgments

- Inspired by modern productivity apps like Notion and Headspace
- Icons from Chrome Extension guidelines
- Design principles from Apple Human Interface Guidelines

## 📞 Support

If you have any questions or issues, please open an issue on GitHub.

## 🗺️ Roadmap

- [ ] Chrome Web Store publication
- [ ] Statistics dashboard
- [ ] Custom tab age threshold
- [ ] Domain whitelist
- [ ] Export/import settings
- [ ] Multi-language support

---

Made with ❤️ for a cleaner, more mindful web experience
