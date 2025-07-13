import styles from "./UserPage.module.scss";
import {useNavigate} from "react-router";

export const UserPage = () => {
    const navigate = useNavigate();


    return (
        <div className={styles.userPage}>
            <div className={styles.card}>
                <button onClick={() => navigate(-1)}>Назад</button>

            </div>
        </div>
    );
};
