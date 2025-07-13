import {NavLink} from "react-router";
import styles from './Nav.module.scss'
import {PATH} from "../../app/paths.ts";

export const Sidebar = () => {
    return <nav className={styles.nav}>
			<NavLink to={PATH.HOME} className={styles.nav__link}>🏠 Главная</NavLink>
			<NavLink to={PATH.USERS} className={styles.nav__link}>👥 Пользователи</NavLink>
			<NavLink to={PATH.CHAT} className={styles.nav__link}>👥 Чаты</NavLink>
		</nav>
};