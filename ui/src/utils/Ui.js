import * as TileType from '../constants/TileType';

export default class Ui {
  constructor () {
    this.gameElem = document.getElementById('game');
    this.connectionIndicator = document.getElementById('connection-indicator');
    this.commandIndicator = document.getElementById('command-indicator');
    this.alertElem = document.getElementById('alert');
    this.agentFocus = document.getElementById('agent-focus');
    this.inventoryElem = document.getElementById('inventory');
    this.actionLog = document.getElementById('action-log');
  }

  notifyDisconnection = () => {
    this.connectionIndicator.innerHTML = 'Disconnected! The server has probably stopped.';
  };

  setCommandIndicator = (waiting) => {
    const text = waiting ? 'Awaiting new command...' : ' ';
    this.commandIndicator.innerHTML = text;
  };

  reloadWindow = () => {
    location.reload(true);
  }

  alert = (message) => {
    this.alertElem.innerHTML = message;
    setTimeout(() => {
      this.alertElem.innerHTML = '';
    }, 3000);
  }

  setAgentFocus = (enable) => {
    if (enable) {
      this.agentFocus.innerHTML = 'ENABLED: Camera focus on agent. Mouse drag on map disabled.';
      this.gameElem.setAttribute('class', 'drag-disabled');
    } else {
      this.agentFocus.innerHTML = 'DISABLED: Camera do not focus on agent. Use mouse to drag map. Scroll to zoom in/out.';
      this.gameElem.setAttribute('class', 'drag-enabled');
    }
  };

  setInventory = (inventory) => {
    if (inventory.size === 0) {
      this.inventoryElem.innerHTML = "<span style='color:#ccc'>empty</span>";
      return;
    }
    let html = '<ul>';
    html += Array.from(inventory.entries()).map(entry => {
      if (entry[0] === TileType.DYNAMITE) {
        return `<li>${entry[0]}: ${entry[1]}</li>`;
      } else {
        return `<li>${entry[0]}</li>`;
      }
    }).join('');
    html += '</ul>';
    this.inventoryElem.innerHTML = html;
  }

  log = (message) => {
    this.actionLog.value += message + '\n';
    this.actionLog.scrollTop = this.actionLog.scrollHeight;
  };
}
