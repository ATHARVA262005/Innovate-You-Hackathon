import React, { useContext, useEffect, useState } from 'react';
import { UserContext } from '../context/user.context';
import { useNavigate } from 'react-router-dom';

const UserAuth = ({ children }) => {
    const { user } = useContext(UserContext);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Check if user is authenticated
        if (!user) {
            navigate('/login');
        } else {
            setLoading(false);
        }
    }, [user, navigate]);

    if (loading) {
        return <div>Loading...</div>;
    }

    return <>{children}</>;
};

export default UserAuth;
