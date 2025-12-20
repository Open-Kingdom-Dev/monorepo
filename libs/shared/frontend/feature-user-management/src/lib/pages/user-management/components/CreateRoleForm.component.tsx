import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { styles } from '../../../styles';
import { FormField } from '../../../components';
import { createRoleSchema, type CreateRoleFormData } from '../../../schemas';

interface CreateRoleFormProps {
  onSubmit: (data: CreateRoleFormData) => Promise<void>;
  isLoading?: boolean;
}

export function CreateRoleForm({ onSubmit, isLoading }: CreateRoleFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateRoleFormData>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: { name: '', description: '' },
  });

  const handleFormSubmit = async (data: CreateRoleFormData) => {
    await onSubmit(data);
    reset();
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="mb-6 flex gap-4 items-end"
    >
      <FormField
        id="name"
        label="Role Name"
        placeholder="Enter role name"
        error={errors.name?.message}
        className="flex-1"
        {...register('name')}
      />
      <FormField
        id="description"
        label="Description"
        placeholder="Optional description"
        className="flex-1"
        {...register('description')}
      />
      <button
        type="submit"
        disabled={isLoading}
        className={styles.buttonPrimary}
      >
        {isLoading ? 'Creating...' : 'Create'}
      </button>
    </form>
  );
}
