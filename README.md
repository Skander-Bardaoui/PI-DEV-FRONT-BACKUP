# PI-DEV Frontend

Modern, accessible ERP frontend application built with React, TypeScript, Vite, and Tailwind CSS. Features a comprehensive business management interface with real-time collaboration, AI-powered tools, and full accessibility support.

## 🚀 Features

### Core Functionality
- **Sales Management** - Invoices, quotes, sales orders, delivery notes, recurring invoices
- **Purchase Management** - Suppliers, purchase orders, goods receipts, 3-way matching
- **Inventory Control** - Stock movements, warehouse management, product tracking
- **Treasury & Payments** - Account management, transactions, transfers, payment tracking
- **Client Portal** - Secure client access for order confirmation and document viewing
- **Supplier Portal** - Supplier onboarding and order management interface

### Collaboration Features
- **Real-time Messaging** - WebSocket-based chat with typing indicators
- **Task Management** - Kanban board with drag-and-drop, subtasks, progress tracking
- **Threaded Conversations** - Nested message threads for organized discussions
- **Color-coded Chat** - Personalized message colors per user
- **Notifications** - Real-time updates and alerts

### AI-Powered Tools
- **OCR Document Processing** - Automatic data extraction from invoices and documents
- **AI Email Generation** - Smart email drafting with customization
- **3-Way Matching** - Intelligent PO/GR/Invoice reconciliation
- **Supplier Insights** - AI-based supplier performance analysis
- **Auto Subtask Generation** - AI-powered task breakdown

### Accessibility Features
- **WCAG 2.1 AA Compliant** - Full accessibility support
- **Screen Reader Optimized** - ARIA labels and semantic HTML
- **Keyboard Navigation** - Complete keyboard accessibility
- **Text-to-Speech** - Built-in content reading
- **High Contrast Mode** - Enhanced visibility options
- **Font Size Control** - Adjustable text sizing
- **Focus Mode** - Distraction-free interface
- **Finger Scroll Control** - Touch-friendly navigation

### UI/UX Features
- **Dark Mode** - System-aware theme switching
- **Responsive Design** - Mobile, tablet, and desktop optimized
- **Multi-language Support** - i18n with French and Arabic
- **PDF Export** - Professional document generation
- **Drag & Drop** - Intuitive file uploads and task management
- **Real-time Updates** - WebSocket integration for live data

## 📋 Prerequisites

- Node.js >= 18.x
- npm or pnpm
- Backend API running (see PI-DEV-BACKEND)

## 🛠️ Installation

1. Clone the repository
```bash
git clone <repository-url>
cd PI-DEV-FRONT
```

2. Install dependencies
```bash
npm install
# or
pnpm install
```

3. Configure environment variables
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```
Application runs on `http://localhost:5173`

### Production Build
```bash
npm run build
npm run preview
```

### Linting
```bash
npm run lint
```

## 📁 Project Structure

```
src/
├── api/                  # API client functions
├── components/           # React components
│   ├── ui/              # Reusable UI components (shadcn/ui)
│   ├── sales/           # Sales module components
│   ├── purchases/       # Purchase module components
│   ├── stock/           # Inventory components
│   ├── treasury/        # Treasury components
│   └── profile/         # User profile components
├── context/             # React context providers
│   ├── AuthContext.tsx
│   ├── AccessibilityContext.tsx
│   └── NotificationsContext.tsx
├── hooks/               # Custom React hooks
├── i18n/                # Internationalization
│   └── locales/         # Translation files
├── layouts/             # Page layouts
├── pages/               # Page components
│   ├── backoffice/      # Admin/internal pages
│   └── frontoffice/     # Client-facing pages
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
├── styles/              # Global styles
└── lib/                 # Library configurations
```

## 🎨 Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Component library
- **React Query** - Data fetching and caching
- **React Router** - Client-side routing
- **Socket.io Client** - WebSocket communication
- **i18next** - Internationalization
- **Zustand** - State management
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **jsPDF** - PDF generation
- **Lucide React** - Icon library

## 🔑 Key Features Guide

### Authentication
- Login/Register with email verification
- JWT token management with auto-refresh
- Role-based access control
- Profile management

### Sales Workflow
1. Create quotes → Send to clients
2. Convert quotes to sales orders
3. Generate delivery notes
4. Create invoices (manual or from orders)
5. Send invoices with AI-generated emails
6. Track payments and reminders

### Purchase Workflow
1. Manage suppliers with scoring
2. Create purchase orders
3. Receive goods with receipts
4. Match PO/GR/Invoice (3-way matching)
5. Process supplier payments

### Collaboration
- Create tasks with drag-and-drop Kanban
- Add subtasks (manual or AI-generated)
- Real-time chat with threading
- File attachments and mentions
- Progress tracking

## 🎯 Accessibility Features

The application is built with accessibility as a priority:

- **Keyboard Navigation**: Full keyboard support with visible focus indicators
- **Screen Readers**: Comprehensive ARIA labels and semantic HTML
- **Text-to-Speech**: Built-in content reading functionality
- **High Contrast**: Enhanced visibility mode
- **Font Scaling**: Adjustable text sizes
- **Focus Mode**: Reduced distractions for better concentration
- **Touch Controls**: Finger scroll for touch devices

See `ACCESSIBILITY.md` for detailed guidelines.

## 🌐 Internationalization

Supported languages:
- French (fr)
- Arabic (ar)

Add new translations in `src/i18n/locales/`.

## 🐳 Docker Deployment

```bash
# Build image
docker build -t pi-dev-frontend .

# Run container
docker run -p 80:80 pi-dev-frontend
```

## ☸️ Kubernetes Deployment

```bash
# Apply configurations
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

## 📚 Additional Documentation

- `ACCESSIBILITY.md` - Accessibility implementation guide
- `DARK-MODE-GUIDE.md` - Dark mode usage
- `FINGER_SCROLL_GUIDE.md` - Touch control implementation
- `SALES_UI_GUIDE.md` - Sales module UI guide
- `SALES_OCR_INTEGRATION.md` - OCR feature documentation

## 🎨 Customization

### Theme Colors
Edit `tailwind.config.js` to customize the color palette:
```js
theme: {
  extend: {
    colors: {
      primary: {...},
      secondary: {...}
    }
  }
}
```

### Components
UI components are based on shadcn/ui. Customize in `src/components/ui/`.

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:3001` |
| `VITE_WS_URL` | WebSocket URL | `ws://localhost:3001` |

## 🧪 Testing

```bash
# Run tests (when configured)
npm run test

# Run tests with coverage
npm run test:coverage
```

## 🚀 Performance Optimization

- Code splitting with React.lazy
- Image optimization
- Bundle size optimization with Vite
- React Query caching
- Memoization with useMemo/useCallback
- Virtual scrolling for large lists

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 Code Style

- Follow ESLint configuration
- Use TypeScript for type safety
- Follow component naming conventions
- Write accessible HTML
- Add JSDoc comments for complex functions

## 🐛 Known Issues

Check the issues tab for known bugs and feature requests.

## 📝 License

This project is proprietary and confidential.

## 👥 Support

For support and questions, contact the development team.

---

Built with ❤️ using [React](https://react.dev/) + [Vite](https://vitejs.dev/) + [Tailwind CSS](https://tailwindcss.com/)
