declare module 'react-native-confetti-cannon' {
  import { Component } from 'react';
  
  export interface ConfettiProps {
    count?: number;
    origin?: { x: number; y: number };
    autoStart?: boolean;
    fadeOut?: boolean;
    fallSpeed?: number;
    explosionSpeed?: number;
    colors?: string[];
  }

  class ConfettiCannon extends Component<ConfettiProps> {
    start(): void;
  }

  export default ConfettiCannon;
} 