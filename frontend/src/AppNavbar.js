import React, { useState, useEffect } from 'react';
import { Navbar, NavbarBrand, NavLink, NavItem, Nav, NavbarText, NavbarToggler, Collapse } from 'reactstrap';
import { Link } from 'react-router-dom';
import tokenService from './services/token.service';
import jwt_decode from "jwt-decode";

function AppNavbar() {
    const [roles, setRoles] = useState([]);
    const [username, setUsername] = useState("");
    const jwt = tokenService.getLocalAccessToken();
    const [collapsed, setCollapsed] = useState(true);

    const toggleNavbar = () => setCollapsed(!collapsed);

    useEffect(() => {
        if (jwt) {
            setRoles(jwt_decode(jwt).authorities);
            setUsername(jwt_decode(jwt).sub);
        }
    }, [jwt])

    let adminLinks = <></>;
    let userLogout = <></>;
    let publicLinks = <></>;

    roles.forEach((role) => {
        if (role === "ADMIN") {
            adminLinks = (
                <>
                    <NavItem>
                        <NavLink className="ba-nav-link" tag={Link} to="/users">Users</NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink className="ba-nav-link" tag={Link} to="/formations">Formations</NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink className="ba-nav-link" tag={Link} to="/qr-generator">QR Generator</NavLink>
                    </NavItem>
                </>
            )
        }
    })

    if (!jwt) {
        publicLinks = (
            <>
                <NavItem>
                    <NavLink className="ba-nav-link" id="docs" tag={Link} to="/docs">Docs</NavLink>
                </NavItem>
                <NavItem>
                    <NavLink className="ba-nav-link" id="login" tag={Link} to="/login">Login</NavLink>
                </NavItem>
            </>
        )
    } else {
        userLogout = (
            <>
                <NavItem>
                    <NavLink className="ba-nav-link" id="docs" tag={Link} to="/docs">Docs</NavLink>
                </NavItem>
                <NavbarText className="ba-nav-link justify-content-end">{username}</NavbarText>
                <NavItem className="d-flex">
                    <NavLink className="ba-nav-link" id="logout" tag={Link} to="/logout">Logout</NavLink>
                </NavItem>
            </>
        )
    }

    return (
        <div>
            <Navbar expand="md" className="ba-navbar">
                <NavbarBrand href="/" className="ba-navbar-brand">
                    <img alt="BA Glass logo" src="/ba-logo.png" />
                    <span>ShiftSync</span>
                </NavbarBrand>
                <NavbarToggler onClick={toggleNavbar} className="ms-2" />
                <Collapse isOpen={!collapsed} navbar>
                    <Nav className="me-auto mb-2 mb-lg-0" navbar>
                        {adminLinks}
                    </Nav>
                    <Nav className="ms-auto mb-2 mb-lg-0" navbar>
                        {publicLinks}
                        {userLogout}
                    </Nav>
                </Collapse>
            </Navbar>
        </div>
    );
}

export default AppNavbar;