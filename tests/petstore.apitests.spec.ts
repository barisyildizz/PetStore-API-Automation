import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
const file = path.resolve("test.png")
const image = fs.readFileSync(file);

const validRequestBody = JSON.parse(JSON.stringify(require('./testData/validRequestBody.json')));
const invalidRequestBody = JSON.parse(JSON.stringify(require('./testData/invalidIDRequestBody.json')));
const updatedRequestBody = JSON.parse(JSON.stringify(require('./testData/updatedRequestBody.json')));

let petID;

test('should be able to add a new pet', async ({ request }) => {
  const response = await request.post('pet', {
    data: validRequestBody
  });
  expect(response.ok()).toBeTruthy();
  expect(response.status()).toBe(200);
  console.log(await response.json());
  const jsonResponse = await response.json();
  expect(jsonResponse.id).toBe(126474421435);
  expect(jsonResponse.name).toBe('duman');
  expect(jsonResponse.status).toBe("available");
  petID = jsonResponse.id;
});

test('should not be able to add a new pet (method is set to get and should be able to get 405)', async ({ request }) => {
  const response = await request.get('pet', {
    data: validRequestBody
  });
  expect(response.status()).toBe(405);
  console.log(response.status());
});

test('should be able to upload image of pet', async ({ request }) => {
  const response = await request.post(`pet/${petID}/uploadImage`, {
    multipart: {
      additionalMetadata: 'petgorseltest',
      file: {
        name: file,
        mimeType: 'image/png',
        buffer: image,
      },
    },
  });
  expect(response.status()).toBe(200);
  console.log(response.status());
  console.log(await response.json());
  const jsonResponse = await response.json();
  expect(jsonResponse.type).toBe('unknown');
  expect(jsonResponse.message).toContain('petgorseltest');
  expect(jsonResponse.message).toContain('File uploaded');
});

test('should be able to update an existing pet', async ({ request }) => {
  const response = await request.put('pet', {
    data: updatedRequestBody
  });
  expect(response.ok()).toBeTruthy();
  expect(response.status()).toBe(200);
  console.log(await response.json());
  const jsonResponse = await response.json();
  expect(jsonResponse.category.name).toBe('updated');
  expect(jsonResponse.id).toBe(126474421435);
  expect(jsonResponse.tags[0].id).toBe(1533);
  expect(jsonResponse.name).toBe('tarçın');
});

test('should not be able to update an existing pet because ID is Invalid', async ({ request }) => {
  const response = await request.put('pet', {
    data: invalidRequestBody
  });
  expect(response.status()).toBe(500);
  console.log(await response.json());
  const jsonResponse = await response.json();
  expect(jsonResponse.message).toBe('something bad happened');
});

test('should be able to get pet by ID', async ({ request }) => {
  const response = await request.get(`pet/${petID}`);
  expect(response.ok()).toBeTruthy();
  expect(response.status()).toBe(200);
  console.log(await response.json());
  const jsonResponse = await response.json();
  expect(jsonResponse.id).toBe(updatedRequestBody.id);
  expect(jsonResponse.name).toBe(updatedRequestBody.name);
});

test('should not be able to get pet infos because ID does not exist', async ({ request }) => {
  const response = await request.get(`pet/1264744214354564`);
  expect(response.status()).toBe(404);
  console.log(await response.json());
  const jsonResponse = await response.json();
  expect(jsonResponse.code).toBe(1);
  expect(jsonResponse.type).toBe('error');
  expect(jsonResponse.message).toBe('Pet not found');
});

test('should not be able to get pet infos because ID is invalid', async ({ request }) => {
  const response = await request.get(`pet/invalidID`);
  expect(response.status()).toBe(404);
  console.log(await response.json());
  const jsonResponse = await response.json();
  expect(jsonResponse.code).toBe(404);
  expect(jsonResponse.type).toBe('unknown');
  expect(jsonResponse.message).toBe('java.lang.NumberFormatException: For input string: "invalidID"');
});

test('should not be able to get pet infos because ID is missing', async ({ request }) => {
  const response = await request.get(`pet/`);
  expect(response.status()).toBe(405);
  console.log(await response.json());
  const jsonResponse = await response.json();
  expect(jsonResponse.code).toBe(405);
  expect(jsonResponse.type).toBe('unknown');
});

test('should be able to get pet infos by available status', async ({ request }) => {
  const response = await request.get(`pet/findByStatus?status=available`);
  expect(response.status()).toBe(200);
  console.log(await response.json());
  const jsonResponse = await response.json();
  expect(jsonResponse[0].status).toBe('available');
});

test('should be able to get pet infos by pending status', async ({ request }) => {
  const response = await request.get(`pet/findByStatus?status=pending`);
  expect(response.status()).toBe(200);
  console.log(await response.json());
  const jsonResponse = await response.json();
  expect(jsonResponse[0].status).toBe('pending');
});

test('should be able to get pet infos by sold status', async ({ request }) => {
  const response = await request.get(`pet/findByStatus?status=sold`);
  expect(response.status()).toBe(200);
  console.log(await response.json());
  const jsonResponse = await response.json();
  expect(jsonResponse[0].status).toBe('sold');
});

test('should not be able to get pet infos by invalid status', async ({ request }) => {
  const response = await request.get(`pet/findByStatus?status=invalidStatus`);
  //expect(response.status()).toBe(400);
  console.log(await response.json());
  const jsonResponse = await response.json();
  expect(jsonResponse).toEqual([]);
  expect(jsonResponse).toHaveLength(0);
});

test('should be able to update a pet in the store with form data', async ({ request }) => {
  let petIDString = petID.toString();
  const response = await request.post(`pet/${petID}`, {
    form: {
      name: 'duman',
      status: 'pending',
    }
  });
  expect(response.status()).toBe(200);
  console.log(await response.json());
  const jsonResponse = await response.json();
  expect(jsonResponse.code).toBe(200);
  expect(jsonResponse.type).toBe('unknown');
  expect(jsonResponse.message).toBe(petIDString);
});

test('should not be able to update a pet in the store with form data because Pet ID doesnt exist', async ({ request }) => {
  const response = await request.post(`pet/579089879`, {
    form: {
      name: 'duman',
      status: 'pending',
    }
  });
  expect(response.status()).toBe(404);
  console.log(await response.json());
  const jsonResponse = await response.json();
  expect(jsonResponse.code).toBe(404);
  expect(jsonResponse.type).toBe('unknown');
  expect(jsonResponse.message).toBe('not found');
});

test('should be able to delete a pet', async ({ request }) => {
  let petIDString = petID.toString();
  const response = await request.delete(`pet/${petID}`);
  expect(response.status()).toBe(200);
  console.log(await response.json());
  const jsonResponse = await response.json();
  expect(jsonResponse.code).toBe(200);
  expect(jsonResponse.type).toBe('unknown');
  expect(jsonResponse.message).toBe(petIDString);
});

test('should not be able to delete a pet because Pet ID doesnt exist', async ({ request }) => {
  const response = await request.delete(`pet/43532`);
  expect(response.status()).toBe(404);
});
