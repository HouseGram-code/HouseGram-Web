'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4 text-center">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md w-full">
            <h2 className="text-2xl font-bold text-red-500 mb-4">Что-то пошло не так</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Извините, произошла непредвиденная ошибка. Мы уже работаем над ее устранением.
            </p>
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-left text-sm text-gray-800 dark:text-gray-200 overflow-auto max-h-32 mb-6">
              {this.state.error?.message || 'Неизвестная ошибка'}
            </div>
            <button
              className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Попробовать снова
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
