import * as React from 'react';
const raf = require('raf');
const shallowEqual = require('shallowequal');

import {
  Consumer,
  createInitScrollState,
  createInitDimensionsState,
  IScroll as IContextScroll,
  SCROLL_DIR_UP,
  SCROLL_DIR_DOWN,
  SCROLL_DIR_RIGHT,
  SCROLL_DIR_LEFT,
  IDimensions,
} from './ViewportProvider';

interface IProps {}

interface IState extends IContextScroll, IDimensions {}

export interface IScroll {
  x: number;
  y: number;
  xTurn: number;
  yTurn: number;
  xDTurn: number;
  yDTurn: number;
  isScrollingUp: boolean;
  isScrollingDown: boolean;
  isScrollingLeft: boolean;
  isScrollingRight: boolean;
}

export default function connect() {
  return (WrappedComponent: React.ComponentType<any>) => {
    return class ConnectViewport extends React.PureComponent<IProps, IState> {
      tickId: NodeJS.Timer;
      scrollContext: IContextScroll;
      dimensionsContext: IDimensions;

      constructor(props: IProps) {
        super(props);
        this.scrollContext = createInitScrollState();
        this.state = {
          ...createInitScrollState(),
          ...createInitDimensionsState(),
        };
      }

      componentDidMount() {
        this.tick(this.syncState);
      }

      componentWillUnmount() {
        raf.cancel(this.tickId);
      }

      storeContext = (scrollContext: {
        scroll: IState;
        dimensions: IDimensions;
      }) => {
        this.scrollContext = scrollContext.scroll;
        this.dimensionsContext = scrollContext.dimensions;
        return null;
      };

      tick(updater: Function) {
        this.tickId = raf(() => {
          updater();
          this.tick(updater);
        });
      }

      syncState = () => {
        const nextState = { ...this.scrollContext, ...this.dimensionsContext };
        if (!shallowEqual(nextState, this.state)) {
          this.setState(nextState);
        }
      };

      render() {
        const { xDir, yDir, width, height, ...scroll } = this.state;
        return (
          <React.Fragment>
            <Consumer>{this.storeContext}</Consumer>
            <WrappedComponent
              {...this.props}
              scroll={{
                ...scroll,
                isScrollingUp: yDir === SCROLL_DIR_UP,
                isScrollingDown: yDir === SCROLL_DIR_DOWN,
                isScrollingLeft: xDir === SCROLL_DIR_LEFT,
                isScrollingRight: xDir === SCROLL_DIR_RIGHT,
              }}
              dimensions={{ width, height }}
            />
          </React.Fragment>
        );
      }
    };
  };
}