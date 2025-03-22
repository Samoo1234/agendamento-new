import React from 'react';
import styled from 'styled-components';

const ErrorContainer = styled.div`
  padding: 20px;
  margin: 20px;
  border-radius: 8px;
  background-color: #fff3f3;
  border: 1px solid #ffcdd2;
  color: #b71c1c;
`;

const ErrorTitle = styled.h2`
  margin: 0 0 10px 0;
  color: #b71c1c;
`;

const ErrorMessage = styled.p`
  margin: 0 0 10px 0;
  color: #d32f2f;
`;

const ErrorDetails = styled.pre`
  background-color: #ffebee;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.9em;
  color: #c62828;
`;

const RetryButton = styled.button`
  background-color: #d32f2f;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
  font-size: 14px;

  &:hover {
    background-color: #b71c1c;
  }
`;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'Ocorreu um erro inesperado';
      const isMaxUpdateError = errorMessage.includes('Maximum update depth exceeded');

      return (
        <ErrorContainer>
          <ErrorTitle>Algo deu errado</ErrorTitle>
          <ErrorMessage>
            {isMaxUpdateError
              ? 'Ocorreu um erro de atualização. Por favor, tente novamente.'
              : errorMessage}
          </ErrorMessage>
          {this.state.errorInfo && (
            <ErrorDetails>
              {this.state.errorInfo.componentStack}
            </ErrorDetails>
          )}
          <RetryButton onClick={this.handleRetry}>
            Tentar Novamente
          </RetryButton>
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;