import styles from "./UsersPage.module.scss";

export const UsersPage = () => {
    // const { users, loading, error } = useUsers();

    // if (loading) return <p>Загрузка пользователей...</p>;
    // if (error) return <p style={{ color: "red" }}>{error}</p>;

    return (
        <div className={styles.usersPage}>
            <h2 className={styles.usersPage__title}>Пользователи</h2>
            <ul className={styles.usersPage__list}>
                {/*{users.map((u) => (*/}
                {/*    <li key={u.id} className={styles.usersPage__item}>*/}
                {/*        <NavLink to={`/users/${u.id}`} className={styles.usersPage__link}>*/}
                {/*            {u.name}*/}
                {/*        </NavLink>*/}
                {/*    </li>*/}
                {/*))}*/}
            </ul>
        </div>
    );
};
