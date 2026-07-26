import React, { useState, useEffect } from 'react';
import { Navbar, NavbarBrand, NavLink, NavItem, Nav, NavbarToggler, Collapse, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import { Link } from 'react-router-dom';
import { FaUsers, FaGraduationCap, FaQrcode, FaSignOutAlt, FaUserShield, FaUser, FaBookOpen } from 'react-icons/fa';
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
                <UncontrolledDropdown nav inNavbar>
                    <DropdownToggle nav caret className="ba-nav-link d-inline-flex align-items-center">
                        <FaUserShield className="me-2" /> Administration
                    </DropdownToggle>
                    <DropdownMenu className="ba-dropdown-menu">
                        <DropdownItem tag={Link} to="/users" className="ba-dropdown-item d-flex align-items-center">
                            <FaUsers className="me-2" /> Manage Users
                        </DropdownItem>
                        <DropdownItem tag={Link} to="/formations" className="ba-dropdown-item d-flex align-items-center">
                            <FaGraduationCap className="me-2" /> Manage Formations
                        </DropdownItem>
                        <DropdownItem divider />
                        <DropdownItem tag={Link} to="/qr-generator" className="ba-dropdown-item d-flex align-items-center">
                            <FaQrcode className="me-2" /> QR Generator
                        </DropdownItem>
                    </DropdownMenu>
                </UncontrolledDropdown>
            )
        }
    })

    if (!jwt) {
        publicLinks = (
            <>
                <NavItem>
                    <NavLink className="ba-nav-link d-inline-flex align-items-center" id="docs" tag={Link} to="/docs">
                        <FaBookOpen className="me-2" /> Docs
                    </NavLink>
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
                    <NavLink className="ba-nav-link d-inline-flex align-items-center" id="docs" tag={Link} to="/docs">
                        <FaBookOpen className="me-2" /> Docs
                    </NavLink>
                </NavItem>
                <UncontrolledDropdown nav inNavbar>
                    <DropdownToggle nav caret className="ba-nav-link d-inline-flex align-items-center">
                        <FaUser className="me-2" /> {username}
                    </DropdownToggle>
                    <DropdownMenu className="ba-dropdown-menu" right>
                        <DropdownItem tag={Link} to="/logout" className="ba-dropdown-item text-danger d-flex align-items-center">
                            <FaSignOutAlt className="me-2" /> Logout
                        </DropdownItem>
                    </DropdownMenu>
                </UncontrolledDropdown>
            </>
        )
    }

    return (
        <div>
            <Navbar expand="md" className="ba-navbar">
                <NavbarBrand href="/" className="ba-navbar-brand">
                    <div className="logo-crop">
                        <img src="/ba-logo.png" alt="BA Glass" />
                    </div>
                    ShiftSync
                </NavbarBrand>
                <NavbarToggler onClick={toggleNavbar} className="ms-2" />
                <Collapse isOpen={!collapsed} navbar>
                    <Nav className="me-auto" navbar>
                        {adminLinks}
                    </Nav>
                    <Nav navbar>
                        {publicLinks}
                        {userLogout}
                    </Nav>
                </Collapse>
            </Navbar>
        </div>
    );
}

export default AppNavbar;