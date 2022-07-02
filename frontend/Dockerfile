FROM node:18-buster

# Just install the packages; the source code will be loaded in later.
ADD ./package.json /opt/frontend
WORKDIR /opt/frontend
RUN npm install --production=false

CMD ./node_modules/.bin/vite --host 0.0.0.0
