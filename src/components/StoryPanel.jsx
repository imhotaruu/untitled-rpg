import { Component, createRef } from "react";
import { getPrependedStoryCount } from "../utils/storyHistory";
import LogScrollControl from "./ui/LogScrollControl";

// The pre-update snapshot keeps the visible passage anchored before React inserts
// new text. This also handles the engine trimming the oldest entries at its cap.
export default class StoryPanel extends Component {
  state = { hasUnread: false, isAwayFromTop: false };
  readerRef = createRef();
  listRef = createRef();

  getSnapshotBeforeUpdate(previousProps) {
    const added = getPrependedStoryCount(previousProps.entries, this.props.entries);
    if (added === 0) return null;
    const reader = this.readerRef.current;
    const top = reader.getBoundingClientRect().top;
    const index = Array.from(this.listRef.current.children)
      .findIndex((element) => element.getBoundingClientRect().bottom > top);
    const anchor = this.listRef.current.children[index];
    return {
      added,
      atTop: reader.scrollTop <= 8,
      index,
      offset: anchor ? anchor.getBoundingClientRect().top - top : 0,
    };
  }

  componentDidUpdate(_previousProps, _previousState, snapshot) {
    if (!snapshot) return;
    const reader = this.readerRef.current;
    if (snapshot.added === null || snapshot.atTop) {
      reader.scrollTop = 0;
      if (this.state.hasUnread || this.state.isAwayFromTop) {
        this.setState({ hasUnread: false, isAwayFromTop: false });
      }
      return;
    }
    const anchor = snapshot.index >= 0
      ? this.listRef.current.children[snapshot.index + snapshot.added]
      : null;
    if (anchor) {
      reader.scrollTop += anchor.getBoundingClientRect().top
        - reader.getBoundingClientRect().top - snapshot.offset;
    } else {
      reader.scrollTop = reader.scrollHeight;
    }
    if (!this.state.hasUnread || !this.state.isAwayFromTop) {
      this.setState({ hasUnread: true, isAwayFromTop: true });
    }
  }

  handleScroll = () => {
    const isAwayFromTop = this.readerRef.current.scrollTop > 8;
    this.setState((current) => {
      const hasUnread = isAwayFromTop && current.hasUnread;
      return current.isAwayFromTop === isAwayFromTop && current.hasUnread === hasUnread
        ? null
        : { isAwayFromTop, hasUnread };
    });
  };

  jumpToLatest = () => {
    this.readerRef.current.scrollTop = 0;
    this.readerRef.current.focus({ preventScroll: true });
    this.setState({ hasUnread: false, isAwayFromTop: false });
  };

  render() {
    const { entries } = this.props;
    return (
      <section className="story-panel" aria-label="Story">
        <header className="story-header">
          <h2>Story</h2>
          <LogScrollControl canJump={this.state.isAwayFromTop || this.state.hasUnread}
            hasUnread={this.state.hasUnread} onJump={this.jumpToLatest} />
        </header>
        <div ref={this.readerRef} className="story-reader" role="region" aria-label="Story history"
          tabIndex={0} onScroll={this.handleScroll}>
          <ol ref={this.listRef} className="story-passages">
            {entries.map((entry, index) => (
              <li key={index} className="story-passage" data-latest={index === 0}>
                {index === 0 && <span className="story-latest-label">Latest</span>}
                <p>{entry}</p>
              </li>
            ))}
          </ol>
          {entries.length === 0 && <p className="empty-note">Your story has yet to unfold.</p>}
        </div>
      </section>
    );
  }
}
