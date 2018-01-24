import React from 'react';

import './optionsMenu.css';

class OptionsMenu extends React.Component {
    constructor() {
        super();

        this.toggleDisplay = this.toggleDisplay.bind(this);

        this.state = {
            display: 'none'
        }
    }

    toggleDisplay() {
        if (this.state.display === 'none') {
            this.setState({
                display: 'block'
            })
        }
        else {
            this.setState({
                display: 'none'
            })
        }
    }

    render() {
        return (
            <div className="menu" style={{
                display: this.state.display,
                clear: 'both'
            }}
                onClick={(e) => e.stopPropagation()}>
                <p className="menuitem">Account settings</p>
                <p className="menuitem" onClick={(e) => window.location.href="/changelog"}>Changelog</p>
                <p className="menuitem" onClick={(e) => this.props.logout()}>Log out</p>
            </div>
        )
    }
}

export default OptionsMenu;