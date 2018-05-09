/* optionsMenu.js
* Class for creating a list of options that can be clicked on.
*/

import React from 'react';

import './optionsMenu.css';

class OptionsMenu extends React.Component {
    constructor() {
        super();

        this.toggleDisplay = this.toggleDisplay.bind(this);

        // The state simply holds the menu's display css
        this.state = {
            display: 'none'
        }
    }

    // Hides and shows the menu
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

    // Displays the menu
    render() {
        return (
            <div className="optionsmenu" style={{
                display: this.state.display,
                clear: 'both'
            }}
                onClick={(e) => e.stopPropagation()}>
                <p className="optionsmenuitem">Account settings</p>
                <p className="optionsmenuitem" onClick={(e) => window.location.href="/changelog"}>Changelog</p>
                <p className="optionsmenuitem" onClick={(e) => this.props.logout()}>Log out</p>
            </div>
        )
    }
}

export default OptionsMenu;