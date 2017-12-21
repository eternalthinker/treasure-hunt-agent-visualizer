import 'pixi';
import 'p2';
import Phaser from 'phaser';
import io from 'socket.io-client';

import './index.css';
import BootState from './states/Boot';
import SplashState from './states/Splash';
import GameState from './states/Game';
import config from './config';

class Game extends Phaser.Game {
  constructor () {
    const docElement = document.documentElement;
    const width = docElement.clientWidth > config.gameWidth ? config.gameWidth : docElement.clientWidth;
    const height = docElement.clientHeight > config.gameHeight ? config.gameHeight : docElement.clientHeight;

    super(width, height, Phaser.CANVAS, 'content', null);

    this.state.add('Boot', BootState, false);
    this.state.add('Splash', SplashState, false);
    this.state.add('Game', GameState, false);

    this.state.start('Boot');
  }
}

window.game = new Game();
const socket = io();
const onConnect = () => {
  console.log('Connected: ', socket.id);
};
socket.on('connect', onConnect);
