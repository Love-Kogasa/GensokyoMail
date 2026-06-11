/**
 * Logger —— 接管 console.log/error，输出到页面终端和控制台
 */
export class Logger {
  /**
   * @param {HTMLElement} termElement - <term> 元素
   */
  constructor(termElement) {
    this.term = termElement;
    this.#hook();
  }

  /** 劫持 console */
  #hook() {
    const $log = console.log.bind(console);
    const $err = console.error.bind(console);
    const term = this.term;

    console.log = (...args) => {
      $log(...args);
      const text = args.map(String).join(' ');
      term.appendChild(document.createTextNode(text));
      term.appendChild(document.createElement('br'));
    };

    console.error = (...args) => {
      $err(...args);
      const text = args.map(String).join(' ');
      const font = document.createElement('font');
      font.setAttribute('color', 'red');
      font.textContent = text;
      term.appendChild(font);
      term.appendChild(document.createElement('br'));
    };
  }
}
