import { Component, ReactNode } from 'react';

interface Props { children: ReactNode; pageName: string; }
interface State { error: Error | null; }

export class DebugErrorBoundary extends Component<Props, State> {
  state: State = { error: null };
  
  static getDerivedStateFromError(error: Error): State {
    return { error };
  }
  
  componentDidCatch(error: Error, info: any) {
    console.error(`[${this.props.pageName}]`, error, info);
  }
  
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, background: '#fff1f1', border: '2px solid red', margin: 24 }}>
          <h2>DEBUG: Error in {this.props.pageName}</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error.message}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
