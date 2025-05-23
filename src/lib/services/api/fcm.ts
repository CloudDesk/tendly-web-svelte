import { fetchApi } from './base';


export const fcmTokenApi = {
    save: (userId: string, fcmToken: string): Promise<any> => {
        return fetchApi('/notifications/save-token', {
            method: 'POST',
            body: JSON.stringify({ userId, fcmToken }),
        })
    },
    send: (userId: string, title: string, body: string): Promise<any> => {
        return fetchApi('/notifications/notify', {
            method: 'POST',
            body: JSON.stringify({ userId, title, body }),
        })
    }
}