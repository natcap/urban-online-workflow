FROM node:18-buster

ADD . /opt/frontend-source
WORKDIR /opt/frontend-source
RUN npm install --production=false

CMD ./node_modules/.bin/vite --host 0.0.0.0
