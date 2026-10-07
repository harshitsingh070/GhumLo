import { Component } from "react";
import ErrorState from "./ErrorState.jsx";

/** Top-level crash guard: a render exception anywhere in the tree shows a
 *  friendly recovery card instead of a blank page. */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Visible in devtools/prod logs; never shown raw to users.
    console.error("GhoomLo UI crash:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          className="tcc-container flex min-h-screen items-center justify-center py-16"
          style={{ background: "#F7F9FC" }}
        >
          <div className="w-full max-w-xl">
            <ErrorState
              icon="alert"
              title="The page ran into a problem"
              message="Something unexpected broke this view. Your trip data is safe — reloading usually fixes it."
              suggestions={[
                "Reload the page to restore the last working state",
                "If it keeps happening, try a fresh search from Explore",
              ]}
              actionLabel="Reload page"
              onAction={() => window.location.reload()}
              secondaryLabel="Go to Explore"
              onSecondary={() => {
                this.setState({ error: null });
                window.location.hash = "#/";
              }}
            />
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
