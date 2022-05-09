import { Progress } from 'antd';
import React from 'react';

class ProgressBar extends React.Component {
  state = {
    percent: 0,
  };

  setPercent = (percent: number) => {
      this.setState( { percent } );
  }

  increase = () => {
    let percent = this.state.percent + 10;
    if (percent > 100) {
      percent = 100;
    }
    this.setState({ percent });
  };

  render() {
    return (
        <Progress percent={this.state.percent} />
    );
  }
}

export default ProgressBar;
