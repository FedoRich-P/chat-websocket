import {Outlet} from "react-router";
import styles from './Layout.module.scss'
import {Header} from "../Header/Header.tsx";
import {Sidebar} from "../Sidebar/Sidebar.tsx";


export const Layout = () => {
    return <div className={styles.layout}>
        <Header/>
        <aside className={styles.layout__sidebar}>
            <Sidebar/>
        </aside>
        <main className={styles.layout__main}>
            <Outlet/>
        </main>
    </div>
};
