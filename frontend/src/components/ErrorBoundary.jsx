import React from 'react';
import { withTranslation } from 'react-i18next';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    const { t } = this.props;
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">{t('errorBoundary.title')}</h1>
          <p className="text-gray-600 mb-4">{t('errorBoundary.subtitle')}</p>
          <pre className="bg-gray-100 p-4 rounded text-left overflow-auto text-sm text-red-800">
            {this.state.error && this.state.error.toString()}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {t('errorBoundary.reload')}
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default withTranslation()(ErrorBoundary);
