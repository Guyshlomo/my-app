declare module 'react-native-fireworks' {
  import { Component } from 'react';
  
  interface FireworksProps {
    speed?: number;
    density?: number;
    colors?: string[];
  }

  class Fireworks extends Component<FireworksProps> {}

  export default Fireworks;
} 