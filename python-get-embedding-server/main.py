# import json
# import os
#
# import torch
# import torch.nn as nn
# import torch.onnx
# import torch.nn.functional as F
# from ezkl import ezkl
# from torchvision import transforms
# from PIL import Image
# from facenet_pytorch import InceptionResnetV1, MTCNN
#
# class SiameseNetwork(nn.Module):
#     def __init__(self, threshold=0.6):
#         super(SiameseNetwork, self).__init__()
#         self.model = InceptionResnetV1(pretrained='vggface2')
#         self.threshold = threshold
#         self.transform = transforms.Compose([
#             transforms.Resize((160, 160)),
#             transforms.ToTensor(),
#             transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
#         ])
#
#     def forward_one(self, x):
#         return self.model(x)
#
#     def forward(self, img1, img2):
#         """
#         Forward pass for two tensors (images), computes their embeddings,
#         and returns a tensor indicating if the pairwise distance is below the threshold.
#         """
#         output1 = self.forward_one(img1)
#         output2 = self.forward_one(img2)
#         similarity = F.pairwise_distance(output1, output2)
#         return similarity < self.threshold
#
# def preprocess_image(image_path):
#     """
#     Load, detect face, and preprocess the image given its file path.
#     """
#     mtcnn = MTCNN(keep_all=False)  # Initialize MTCNN here
#     image = Image.open(image_path).convert('RGB')
#
#     # Use MTCNN to detect and crop the face
#     face = mtcnn(image)
#     if face is None:
#         raise ValueError(f"No face detected in image: {image_path}")
#
#     # Transform the face tensor
#     transform = transforms.Compose([
#         transforms.Resize((160, 160)),
#         transforms.ToTensor(),
#         transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
#     ])
#     face = face.unsqueeze(0)  # Add batch dimension if not present
#     return transform(face)
#
# def export_to_onnx(model, file_path):
#     # Set the model to evaluation mode
#     model.eval()
#
#     # Create dummy input tensors
#     dummy_input1 = torch.randn(1, 3, 160, 160)  # Adjust size as necessary
#     dummy_input2 = torch.randn(1, 3, 160, 160)  # Adjust size as necessary
#
#     # Export the model
#     torch.onnx.export(model,
#                       (dummy_input1, dummy_input2),
#                       file_path,
#                       input_names=['input1', 'input2'],
#                       output_names=['output'],
#                       verbose=True,
#                       export_params=True,
#                       opset_version=12,  # Specify the ONNX opset version
#                       dynamic_axes={
#                           'input1': {0: 'batch_size'},
#                           'input2': {0: 'batch_size'},
#                           'output': {0: 'batch_size'}
#                       })  # Handle dynamic batch size
#     # Prepare data for serialization
#     data_array1 = dummy_input1.detach().numpy().reshape(-1).tolist()
#     data_array2 = dummy_input2.detach().numpy().reshape(-1).tolist()
#
#     data = {
#         'input1_data': [data_array1],
#         'input2_data': [data_array2]
#     }
#
#     # Serialize data into file
#     json_path = "input.json"
#     with open(json_path, 'w') as json_file:
#         json.dump(data, json_file)
#
# # Initialize the model
# model = SiameseNetwork(threshold=0.8)
#
# # Export the model
# export_to_onnx(model, 'network.onnx')
# #
# # import torch
# # import torch.onnx
# # import json
# # import os
# # import asyncio
# # import ezkl  # Ensure ezkl is installed and properly configured
# #
# #
# # class MyModel(torch.nn.Module):
# #     def __init__(self):
# #         super(MyModel, self).__init__()
# #
# #     def forward(self, distance):
# #         return torch.less(distance, 0.8)
# #
# #
# # async def main():
# #     # Define the model
# #     model = MyModel()
# #     model.eval()
# #     # Define the inputs
# #     distance = torch.rand(1)  # Random distance value
# #
# #     # Export the model to ONNX format
# #     torch.onnx.export(
# #         model, distance, "network.onnx",
# #         export_params=True,
# #         opset_version=15,
# #         do_constant_folding=True,
# #         input_names=['distance'],
# #         output_names=['output']
# #     )
# #
# #     # Prepare input data
# #     d = distance.detach().numpy().tolist()
# #
# #     data = dict(
# #         input_data=[d],
# #     )
# #
# #     # Serialize data into file
# #     with open("input.json", 'w') as f:
# #         json.dump(data, f)
# #
# #     # Perform operations with ezkl
# #     try:
# #         res = ezkl.gen_settings()
# #         print("Settings generated successfully.")
# #
# #         res = ezkl.compile_circuit()
# #         print("Circuit compiled successfully.")
# #
# #         res = await ezkl.get_srs()
# #         print("SRS obtained successfully.")
# #
# #         res = ezkl.setup()
# #         print("Setup completed successfully.")
# #
# #         witness_path = os.path.join('witness.json')
# #         res = await ezkl.gen_witness()
# #         print("Witness generated successfully.")
# #
# #         proof_path = os.path.join('proof.json')
# #         proof = ezkl.prove(proof_type="single", proof_path=proof_path)
# #         print("Proof generated successfully.")
# #         print(proof)
# #
# #         res = ezkl.verify()
# #         print("Proof verification completed successfully.")
# #
# #         sol_code_path = os.path.join('Verifier.sol')
# #         abi_path = os.path.join('Verifier.abi')
# #
# #         # Create the EVM verifier
# #         res = await ezkl.create_evm_verifier(
# #             sol_code_path=sol_code_path,
# #             abi_path=abi_path,
# #         )
# #         onchain_input_array = []
# #
# #         # using a loop
# #         # avoiding printing last comma
# #         formatted_output = "["
# #         for i, value in enumerate(proof["instances"]):
# #             for j, field_element in enumerate(value):
# #                 onchain_input_array.append(ezkl.felt_to_big_endian(field_element))
# #                 formatted_output += '"' + str(onchain_input_array[-1]) + '"'
# #                 if j != len(value) - 1:
# #                     formatted_output += ", "
# #             if i != len(proof["instances"]) - 1:
# #                 formatted_output += ", "
# #         formatted_output += "]"
# #
# #         # This will be the values you use onchain
# #         # copy them over to remix and see if they verify
# #         # What happens when you change a value?
# #         print("pubInputs: ", formatted_output)
# #         print("proof: ", proof["proof"])
# #     except Exception as e:
# #         print(f"An error occurred: {e}")
# #
# #
# # if __name__ == "__main__":
# #     asyncio.run(main())


# from flask import Flask, request, jsonify
# import torch
# from torchvision import transforms
# from PIL import Image
# from facenet_pytorch import InceptionResnetV1, MTCNN
# import torch.nn as nn
#
# app = Flask(__name__)
#
# class SiameseNetwork(nn.Module):
#     def __init__(self):
#         super(SiameseNetwork, self).__init__()
#         self.model = InceptionResnetV1(pretrained='vggface2')
#
#     def forward_one(self, x):
#         return self.model(x)
#
#     def get_embedding(self, img):
#         with torch.no_grad():
#             return self.forward_one(img)
#
# # Initialize the model
# model = SiameseNetwork()
# model.eval()
#
# # Define image preprocessing
# transform = transforms.Compose([
#     transforms.Resize((160, 160)),
#     transforms.ToTensor(),
#     transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
# ])
#
# @app.route('/embed', methods=['POST'])
# def embed():
#     if 'image1' not in request.files or 'image2' not in request.files:
#         return jsonify({'error': 'Please provide two images.'}), 400
#
#     # Load images
#     image1 = Image.open(request.files['image1']).convert('RGB')
#     image2 = Image.open(request.files['image2']).convert('RGB')
#
#     # Transform images
#     img1 = transform(image1).unsqueeze(0)
#     img2 = transform(image2).unsqueeze(0)
#
#     # Get embeddings
#     embedding1 = model.get_embedding(img1)
#     embedding2 = model.get_embedding(img2)
#
#     # Convert tensors to lists for JSON serialization
#     embedding1_list = embedding1.squeeze().tolist()
#     embedding2_list = embedding2.squeeze().tolist()
#
#     return jsonify({
#         'embedding1': embedding1_list,
#         'embedding2': embedding2_list
#     })
#
# if __name__ == '__main__':
#     app.run(debug=True)


#pip install flask torch torchvision pillow facenet-pytorch
#python embedding_server.py
from flask import Flask, request, jsonify
import torch
from torchvision import transforms
from PIL import Image
from facenet_pytorch import InceptionResnetV1, MTCNN
import torch.nn as nn
import json



app = Flask(__name__)

SCALING_FACTOR = 10**9
class SiameseNetwork(nn.Module):
    def __init__(self):
        super(SiameseNetwork, self).__init__()
        self.model = InceptionResnetV1(pretrained='vggface2')

    def forward_one(self, x):
        return self.model(x)

    def get_embedding(self, img):
        with torch.no_grad():
            return self.forward_one(img)

# Initialize the model
model = SiameseNetwork()
model.eval()

# Define image preprocessing
transform = transforms.Compose([
    transforms.Resize((160, 160)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])
mtcnn = MTCNN(keep_all=False)
def save_embeddings_to_json(embeddings_dict, filename='embeddings.json'):
    # Write embeddings to a JSON file
    with open(filename, 'w') as json_file:
        json.dump(embeddings_dict, json_file)

@app.route('/api/return_embeddings', methods=['POST'])
def embed():
    if 'image1' not in request.files or 'image2' not in request.files:
        return jsonify({'error': 'Please provide two images.'}), 400

    try:
        # Load images
        image1 = Image.open(request.files['image1']).convert('RGB')
        image2 = Image.open(request.files['image2']).convert('RGB')

        # Detect faces in the images
        face1 = mtcnn(image1)
        face2 = mtcnn(image2)

        if face1 is None or face2 is None:
            return jsonify({'error': 'No face detected in one or both images.'}), 404

        # Get embeddings (512-dimensional vectors) directly from MTCNN output
        embedding1 = model.get_embedding(face1.unsqueeze(0))
        embedding2 = model.get_embedding(face2.unsqueeze(0))

        # Scale the embeddings to convert them to integers
        embedding1_scaled = (embedding1 * SCALING_FACTOR).round().squeeze().tolist()
        embedding2_scaled = (embedding2 * SCALING_FACTOR).round().squeeze().tolist()

        # Prepare embeddings for saving
        embeddings_to_save = {
            'embedding1': embedding1_scaled,
            'embedding2': embedding2_scaled
        }

        # Save embeddings to JSON
        save_embeddings_to_json(embeddings_to_save)

        return jsonify(embeddings_to_save)

    except Exception as e:
        return jsonify({'error': str(e)}), 500



if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
#
# from flask import Flask, jsonify
# import torch
# from torchvision import transforms
# from PIL import Image
# from facenet_pytorch import InceptionResnetV1, MTCNN
# import torch.nn as nn
# import os
#
# app = Flask(__name__)
#
# # Custom class for Siamese Network to extract face embeddings
# class SiameseNetwork(nn.Module):
#     def __init__(self):
#         super(SiameseNetwork, self).__init__()
#         self.model = InceptionResnetV1(pretrained='vggface2')
#
#     def forward_one(self, x):
#         return self.model(x)
#
#     def get_embedding(self, img):
#         with torch.no_grad():
#             return self.forward_one(img)
#
# # Initialize the model
# model = SiameseNetwork()
# model.eval()
#
# # Initialize MTCNN for face detection
# mtcnn = MTCNN(keep_all=False)
#
# # Define image preprocessing
# transform = transforms.Compose([
#     transforms.Resize((160, 160)),
#     transforms.ToTensor(),
#     transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
# ])
#
# # Hardcoded image paths
# IMAGE_DIR = r"C:\Users\USER\Downloads"  # Replace with your actual directory path
#
# # Embeddings scaling factor to convert floating-point to an equivalent integer representation
# SCALING_FACTOR = 10**9
# @app.route('/embed/<image1_name>/<image2_name>', methods=['GET'])
# def embed(image1_name, image2_name):
#     image1_path = os.path.join(IMAGE_DIR, image1_name)
#     image2_path = os.path.join(IMAGE_DIR, image2_name)
#
#     if not os.path.exists(image1_path) or not os.path.exists(image2_path):
#         return jsonify({'error': 'One or both images not found.'}), 404
#
#     # Load images
#     image1 = Image.open(image1_path).convert('RGB')
#     image2 = Image.open(image2_path).convert('RGB')
#
#     # Detect faces in the images
#     face1 = mtcnn(image1)
#     face2 = mtcnn(image2)
#
#     if face1 is None or face2 is None:
#         return jsonify({'error': 'No face detected in one or both images.'}), 404
#
#     # Get embeddings (512-dimensional vectors) directly from MTCNN output
#     embedding1 = model.get_embedding(face1.unsqueeze(0))
#     embedding2 = model.get_embedding(face2.unsqueeze(0))
#
#     # Scale the embeddings to convert them to integers
#     embedding1_scaled = (embedding1 * SCALING_FACTOR).round().squeeze().tolist()
#     embedding2_scaled = (embedding2 * SCALING_FACTOR).round().squeeze().tolist()
#
#     return jsonify({
#         'embedding1': embedding1_scaled,
#         'embedding2': embedding2_scaled
#     })
#
#
#
# if __name__ == '__main__':
#     app.run(debug=True)
