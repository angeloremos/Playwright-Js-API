import config from '../data/json/config.json';
import dotenv from 'dotenv';

dotenv.config();
if(process.env.ENV == null){
    var env = process.env.environment;
} else {
    var env = process.env.ENV;
}

export function getBaseUrl() {
    return config[env].baseUrl;
}

export function getUserName() {
    return config[env].userName;
}

export function getPassword() {
    return config[env].password;
}

export function getApiBaseUrl() {
    return config[env].apiBaseUrl;
}

export function getToken() {
    return config[env].token;
}

export function getServiceUrl(serviceName) {
    const services = config[env].services;
    if (!services || !services[serviceName]) {
        throw new Error(`Service "${serviceName}" not found in config for environment "${env}". Available services: ${services ? Object.keys(services).join(', ') : 'none'}`);
    }
    return services[serviceName];
}
