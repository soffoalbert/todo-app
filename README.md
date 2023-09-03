## Assumptions

I assumed the Task model should not have a description field or any other fields to augment its metadata for now as is the case on the Todoist third party app, because my long term vision would be to make it as interoperable as possible and that would entail delaying to incorporate a broader set of properties that might not be needed until there is a better understanding of the good amount of thrid party apps i am interested in integrating into.

## Installation

```bash
$ yarn install
```

## Running the app

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Test

```bash
# unit tests
$ yarn run test

# e2e tests - NOTE: update the .env file before running e2e tests 
$ yarn run test:e2e

# test coverage - NOTE: the coverage here is for unit tests therefore, graphQL resolvers as well as the todoist controller is not included. 
$ yarn run test:cov
```